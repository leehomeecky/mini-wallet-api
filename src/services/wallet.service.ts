import { IWallet } from '../interfaces/wallet.interface';
import { ITransactionRepository } from '../repositories/transaction.repository';
import { IWalletRepository } from '../repositories/wallet.repository';
import {
  CreateWalletDto,
  ExternalTransferDto,
  FundWalletDto,
  InternalTransferDto,
} from '../validators/dto/wallet.dto';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { generateTransactionRef } from '../utils';
import {
  ITransaction,
  PaystackBank,
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../interfaces';
import {
  DEFAULT_EXTERNAL_TRX_CHARGES,
  DEFAULT_INTERNAL_TRX_CHARGES,
} from '../constant';
import { IPaystackUtil } from '../utils/paystack.util';

export interface IWalletService {
  createWallet(args: CreateWalletDto & { userId: string }): Promise<IWallet>;

  getBanks(): Promise<PaystackBank[]>;

  getBalance(userId: string): Promise<number>;

  getWallet(userId: string): Promise<IWallet>;

  fundWallet(args: FundWalletDto & { userId: string }): Promise<IWallet>;

  internalFundTransfer(
    args: InternalTransferDto & { userId: string }
  ): Promise<{ from: IWallet; to: IWallet }>;

  externalTransfer(
    args: ExternalTransferDto & { userId: string }
  ): Promise<ITransaction>;

  getWalletTransactions(
    userId: string,
    filters?: Partial<ITransaction>,
    limit?: number,
    offset?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ data: ITransaction[]; total: number }>;
}

export class WalletService implements IWalletService {
  constructor(
    private readonly paystackUtil: IPaystackUtil,
    private readonly walletRepo: IWalletRepository,
    private readonly trxRepo: ITransactionRepository
  ) {}

  async createWallet(
    args: CreateWalletDto & { userId: string }
  ): Promise<IWallet> {
    const { userId, trxPin, currency } = args;
    const existing = await this.walletRepo.findByUserId(userId);
    if (existing) {
      delete existing.trxPin;
      return existing;
    }

    const wallet = await this.walletRepo.createWallet({
      userId,
      trxPin,
      currency,
    });

    delete wallet.trxPin;
    return wallet;
  }

  async getBanks(): Promise<PaystackBank[]> {
    return await this.paystackUtil.listBanks();
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');
    return wallet.balance;
  }

  async getWallet(userId: string): Promise<IWallet> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');
    delete wallet.trxPin;
    return wallet;
  }

  async fundWallet(args: FundWalletDto & { userId: string }): Promise<IWallet> {
    const { amount, userId, walletId } = args;

    if (amount <= 0) throw new Error('Amount must be positive');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await this.walletRepo.updateBalance(
        walletId,
        userId,
        amount,
        session
      );

      if (!wallet) throw new Error('Wallet not found');

      await this.trxRepo.createTransaction(
        {
          amount,
          wallet: wallet._id!,
          type: TransactionType.CREDIT,
          user: new Types.ObjectId(userId),
          reference: generateTransactionRef(),
          channel: TransactionChannel.INTERNAL,
          status: TransactionStatus.SUCCESSFUL,
          metadata: { toUserId: wallet.user.toString() },
        },
        session
      );
      await session.commitTransaction();
      session.endSession();
      delete wallet.trxPin;

      return wallet;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async internalFundTransfer(
    args: InternalTransferDto & { userId: string }
  ): Promise<{ from: IWallet; to: IWallet }> {
    const { note, trxPin, userId, toUserId, amount } = args;

    if (userId === toUserId) throw new Error('Cannot transfer to self');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sender = await this.walletRepo.findByUserId(userId, session);
      const recipient = await this.walletRepo.findByUserId(toUserId, session);

      if (!sender) throw new Error('Sender wallet not found');
      if (!recipient) throw new Error('Recipient wallet not found');

      const totalTrxCharges = Object.values(
        DEFAULT_INTERNAL_TRX_CHARGES
      ).reduce((sum, val) => sum + val, 0);

      const totalDebitAmount = amount + totalTrxCharges;
      if (sender.balance < totalDebitAmount)
        throw new Error('Insufficient funds');

      const isMatch = await bcrypt.compare(trxPin, sender.trxPin ?? '');
      if (!isMatch) throw new Error('Invalid transaction pin');

      const senderWalletId = sender._id!;
      const recipientWalletId = recipient._id!;

      const updatedSender = await this.walletRepo.updateBalance(
        senderWalletId.toString(),
        userId,
        -totalDebitAmount,
        session
      );
      const updatedRecipient = await this.walletRepo.updateBalance(
        recipientWalletId.toString(),
        toUserId,
        amount,
        session
      );

      await this.trxRepo.createTransaction(
        {
          note,
          amount,
          metadata: { toUserId },
          wallet: senderWalletId,
          type: TransactionType.DEBIT,
          user: new Types.ObjectId(userId),
          reference: generateTransactionRef(),
          channel: TransactionChannel.INTERNAL,
          status: TransactionStatus.SUCCESSFUL,
          trxCharges: DEFAULT_INTERNAL_TRX_CHARGES,
        },
        session
      );

      await this.trxRepo.createTransaction(
        {
          note,
          amount,
          wallet: recipientWalletId,
          type: TransactionType.CREDIT,
          metadata: { fromUserId: userId },
          user: new Types.ObjectId(toUserId),
          reference: generateTransactionRef(),
          channel: TransactionChannel.INTERNAL,
          status: TransactionStatus.SUCCESSFUL,
        },
        session
      );

      await session.commitTransaction();
      session.endSession();

      delete updatedSender?.trxPin;
      delete updatedRecipient?.trxPin;

      return {
        from: updatedSender!,
        to: updatedRecipient!,
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async externalTransfer(
    args: ExternalTransferDto & { userId: string }
  ): Promise<ITransaction> {
    const {
      note,
      trxPin,
      userId,
      amount,
      bankCode,
      accountNumber,
      recipientName,
    } = args;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sender = await this.walletRepo.findByUserId(userId, session);
      if (!sender) throw new Error('Wallet not found');

      const isMatch = await bcrypt.compare(trxPin, sender.trxPin ?? '');
      if (!isMatch) throw new Error('Invalid transaction pin');

      const totalTrxCharges = Object.values(
        DEFAULT_EXTERNAL_TRX_CHARGES
      ).reduce((sum, val) => sum + val, 0);

      const totalDebitAmount = amount + totalTrxCharges;
      if (sender.balance < totalDebitAmount)
        throw new Error('Insufficient funds');

      const verifyAccount = await this.paystackUtil.verifyAccount(
        accountNumber,
        bankCode
      );

      if (!verifyAccount) throw new Error('Invalid account credentials');

      const recipient = await this.paystackUtil.createTransferRecipient({
        bankCode,
        accountNumber,
        name: recipientName,
      });

      const transfer = await this.paystackUtil.initiateTransfer(
        amount,
        recipient.recipient_code,
        note
      );

      await this.walletRepo.updateBalance(
        sender._id!.toString(),
        userId,
        -totalDebitAmount,
        session
      );

      const transaction = await this.trxRepo.createTransaction(
        {
          note,
          amount,
          user: sender.user,
          wallet: sender._id!,
          type: TransactionType.DEBIT,
          reference: transfer.reference,
          status: TransactionStatus.PENDING,
          channel: TransactionChannel.EXTERNAL,
          trxCharges: DEFAULT_EXTERNAL_TRX_CHARGES,

          metadata: {
            bankCode,
            transfer,
            recipient,
            accountNumber,
          },
        },
        session
      );

      await session.commitTransaction();
      session.endSession();

      return transaction;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async getWalletTransactions(
    userId: string,
    filters?: Partial<ITransaction>,
    limit?: number,
    offset?: number,
    startDate?: Date,
    endDate?: Date
  ) {
    return await this.trxRepo.findByUser(
      userId,
      filters,
      limit,
      offset,
      startDate,
      endDate
    );
  }
}
