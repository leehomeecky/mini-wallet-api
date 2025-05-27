import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { generateTransactionRef } from '../utils';
import { IWalletService, WalletService } from '../services/wallet.service';
import { IWalletRepository } from '../repositories/wallet.repository';
import { ITransactionRepository } from '../repositories/transaction.repository';
import { IPaystackUtil } from '../utils/paystack.util';
import {
  Currency,
  ITransaction,
  IWallet,
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../interfaces';
import { DEFAULT_EXTERNAL_TRX_CHARGES } from '../constant';

jest.mock('../utils', () => ({
  generateTransactionRef: jest.fn(() => 'trx-ref-123'),
}));

jest.mock('bcrypt');

const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest
  .spyOn(mongoose, 'startSession')
  .mockImplementation(() => Promise.resolve(mockSession as any));

describe('WalletService', () => {
  let walletService: IWalletService;
  let walletRepo: IWalletRepository;
  let trxRepo: ITransactionRepository;
  let paystackUtil: IPaystackUtil;

  beforeEach(() => {
    walletRepo = {
      findByUserId: jest.fn(),
      createWallet: jest.fn(),
      updateBalance: jest.fn(),
    };
    trxRepo = {
      findByUser: jest.fn(),
      createTransaction: jest.fn(),
    };
    paystackUtil = {
      listBanks: jest.fn(),
      verifyAccount: jest.fn(),
      verifyTransfer: jest.fn(),
      initiateTransfer: jest.fn(),
      createTransferRecipient: jest.fn(),
    };

    walletService = new WalletService(paystackUtil, walletRepo, trxRepo);
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    const mockWallet = {
      _id: 'wallet1',
      user: 'user1',
      trxPin: 'hashed-pin',
      balance: 0,
      currency: Currency.NGN,
    };

    const dto = {
      userId: 'user1',
      trxPin: '1234',
      currency: Currency.NGN,
    };

    it('returns existing wallet if found', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValue({
        ...mockWallet,
      });

      const result = await walletService.createWallet(dto);

      expect(walletRepo.findByUserId).toHaveBeenCalledWith('user1');
      expect(walletRepo.createWallet).not.toHaveBeenCalled();
      expect(result).toEqual({
        _id: 'wallet1',
        user: 'user1',
        balance: 0,
        currency: Currency.NGN,
      });
    });

    it('creates a new wallet if none exists', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValue(null);
      (walletRepo.createWallet as jest.Mock).mockResolvedValue({
        ...mockWallet,
      });

      const result = await walletService.createWallet(dto);

      expect(walletRepo.findByUserId).toHaveBeenCalledWith('user1');
      expect(walletRepo.createWallet).toHaveBeenCalledWith({
        userId: 'user1',
        trxPin: '1234',
        currency: Currency.NGN,
      });
      expect(result).toEqual({
        _id: 'wallet1',
        user: 'user1',
        balance: 0,
        currency: Currency.NGN,
      });
    });
  });

  describe('getBanks', () => {
    it('returns list of banks from Paystack', async () => {
      const banks = [
        { name: 'Access Bank', code: '044' },
        { name: 'GTBank', code: '058' },
      ];
      (paystackUtil.listBanks as jest.Mock).mockResolvedValue(banks);

      const result = await walletService.getBanks();

      expect(paystackUtil.listBanks).toHaveBeenCalled();
      expect(result).toEqual(banks);
    });
  });

  describe('getBalance', () => {
    it('returns balance for a valid wallet', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValue({
        _id: 'wallet1',
        user: 'user1',
        balance: 500,
        currency: 'NGN',
      });

      const result = await walletService.getBalance('user1');

      expect(walletRepo.findByUserId).toHaveBeenCalledWith('user1');
      expect(result).toBe(500);
    });

    it('throws if wallet not found', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(walletService.getBalance('user1')).rejects.toThrow(
        'Wallet not found'
      );
    });
  });

  describe('getWallet', () => {
    it('returns wallet without trxPin', async () => {
      const wallet = {
        _id: 'wallet1',
        user: 'user1',
        trxPin: 'secret-pin',
        balance: 1000,
        currency: 'NGN',
      };

      (walletRepo.findByUserId as jest.Mock).mockResolvedValue({ ...wallet });

      const result = await walletService.getWallet('user1');

      expect(walletRepo.findByUserId).toHaveBeenCalledWith('user1');
      expect(result).toEqual({
        _id: 'wallet1',
        user: 'user1',
        balance: 1000,
        currency: 'NGN',
      });
    });

    it('throws if wallet not found', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(walletService.getWallet('user1')).rejects.toThrow(
        'Wallet not found'
      );
    });
  });

  describe('fundWallet', () => {
    it('throws if amount is not positive', async () => {
      await expect(
        walletService.fundWallet({
          amount: 0,
          userId: 'user1',
          walletId: 'wallet1',
        })
      ).rejects.toThrow('Amount must be positive');
    });

    it('throws if wallet not found after update', async () => {
      (walletRepo.updateBalance as jest.Mock).mockResolvedValue(null);

      await expect(
        walletService.fundWallet({
          amount: 500,
          userId: 'user1',
          walletId: 'wallet1',
        })
      ).rejects.toThrow('Wallet not found');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('funds wallet and creates transaction successfully', async () => {
      const userId = '507f191e810c19729de860ea';
      const wallet: IWallet = {
        _id: new Types.ObjectId(),
        user: new Types.ObjectId(userId),
        balance: 1500,
        trxPin: 'hashed',
        currency: Currency.NGN,
      };

      (walletRepo.updateBalance as jest.Mock).mockResolvedValue({ ...wallet });
      (trxRepo.createTransaction as jest.Mock).mockResolvedValue({
        id: 'trx1',
      });

      const result = await walletService.fundWallet({
        amount: 500,
        userId,
        walletId: 'wallet1',
      });

      expect(walletRepo.updateBalance).toHaveBeenCalledWith(
        'wallet1',
        userId,
        500,
        mockSession
      );
      expect(trxRepo.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500,
          wallet: wallet._id,
          type: 'CREDIT',
          user: expect.any(Types.ObjectId),
          reference: 'trx-ref-123',
          channel: 'INTERNAL',
          status: 'SUCCESSFUL',
          metadata: { toUserId: wallet.user.toString() },
        }),
        mockSession
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      const expectedWallet = { ...wallet };
      delete expectedWallet.trxPin;
      expect(result).toEqual(expectedWallet);
    });

    it('aborts transaction if an unexpected error occurs', async () => {
      (walletRepo.updateBalance as jest.Mock).mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        walletService.fundWallet({
          amount: 500,
          userId: 'user1',
          walletId: 'wallet1',
        })
      ).rejects.toThrow('DB error');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('internalFundTransfer', () => {
    it('successfully transfers internally between two wallets', async () => {
      const senderId = '507f191e810c19729de860ea';
      const recipientId = '507f1f77bcf86cd799439011';

      const senderWallet: IWallet = {
        _id: new Types.ObjectId(),
        user: new Types.ObjectId(senderId),
        balance: 2000,
        trxPin: 'hashed-pin',
        currency: Currency.NGN,
      };

      const recipientWallet: IWallet = {
        _id: new Types.ObjectId(),
        user: new Types.ObjectId(recipientId),
        balance: 500,
        trxPin: 'hashed-pin-2',
        currency: Currency.NGN,
      };

      const updatedSender: IWallet = {
        ...senderWallet,
        balance: 1900, // 2000 - 100 (amount + charges)
      };

      const updatedRecipient: IWallet = {
        ...recipientWallet,
        balance: 600, // 500 + 100
      };

      (walletRepo.findByUserId as jest.Mock)
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(recipientWallet);

      (walletRepo.updateBalance as jest.Mock)
        .mockResolvedValueOnce(updatedSender)
        .mockResolvedValueOnce(updatedRecipient);

      (trxRepo.createTransaction as jest.Mock).mockResolvedValue({});

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await walletService.internalFundTransfer({
        amount: 100,
        trxPin: '1234',
        userId: senderId,
        toUserId: recipientId,
        note: 'Test transfer',
      });

      expect(walletRepo.findByUserId).toHaveBeenCalledTimes(2);
      expect(walletRepo.updateBalance).toHaveBeenCalledTimes(2);
      expect(trxRepo.createTransaction).toHaveBeenCalledTimes(2);

      expect(trxRepo.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          wallet: senderWallet._id,
          type: 'DEBIT',
          user: expect.any(Types.ObjectId),
          metadata: { toUserId: recipientId },
        }),
        mockSession
      );

      expect(trxRepo.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          wallet: recipientWallet._id,
          type: 'CREDIT',
          user: expect.any(Types.ObjectId),
          metadata: { fromUserId: senderId },
        }),
        mockSession
      );

      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(result).toEqual({
        from: expect.objectContaining({ balance: 1900 }),
        to: expect.objectContaining({ balance: 600 }),
      });
    });

    it('throws if user tries to transfer to self', async () => {
      const userId = '507f191e810c19729de860ea';

      await expect(
        walletService.internalFundTransfer({
          amount: 100,
          trxPin: '1234',
          userId,
          toUserId: userId,
          note: 'Self transfer',
        })
      ).rejects.toThrow('Cannot transfer to self');
    });

    it('throws if sender wallet is not found', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        walletService.internalFundTransfer({
          amount: 100,
          trxPin: '1234',
          userId: 'senderId',
          toUserId: 'recipientId',
          note: 'Test',
        })
      ).rejects.toThrow('Sender wallet not found');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('throws if recipient wallet is not found', async () => {
      (walletRepo.findByUserId as jest.Mock)
        .mockResolvedValueOnce({
          _id: new Types.ObjectId(),
          balance: 500,
          trxPin: 'hashed',
          user: new Types.ObjectId(),
        })
        .mockResolvedValueOnce(null);

      await expect(
        walletService.internalFundTransfer({
          amount: 100,
          trxPin: '1234',
          userId: 'senderId',
          toUserId: 'recipientId',
          note: 'Test',
        })
      ).rejects.toThrow('Recipient wallet not found');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('throws if sender has insufficient funds', async () => {
      const sender = {
        _id: new Types.ObjectId(),
        balance: 50,
        trxPin: 'hashed',
        user: new Types.ObjectId(),
      };

      const recipient = {
        _id: new Types.ObjectId(),
        balance: 0,
        trxPin: 'hashed2',
        user: new Types.ObjectId(),
      };

      (walletRepo.findByUserId as jest.Mock)
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(recipient);

      await expect(
        walletService.internalFundTransfer({
          amount: 100,
          trxPin: '1234',
          userId: 'senderId',
          toUserId: 'recipientId',
          note: 'Test',
        })
      ).rejects.toThrow('Insufficient funds');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('throws if transaction PIN is incorrect', async () => {
      const sender = {
        _id: new Types.ObjectId(),
        balance: 1000,
        trxPin: 'hashed',
        user: new Types.ObjectId(),
      };

      const recipient = {
        _id: new Types.ObjectId(),
        balance: 0,
        trxPin: 'hashed2',
        user: new Types.ObjectId(),
      };

      (walletRepo.findByUserId as jest.Mock)
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(recipient);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        walletService.internalFundTransfer({
          amount: 100,
          trxPin: 'wrong-pin',
          userId: 'senderId',
          toUserId: 'recipientId',
          note: 'Test',
        })
      ).rejects.toThrow('Invalid transaction pin');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('externalTransfer', () => {
    it('throws if wallet is not found', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(
        walletService.externalTransfer({
          amount: 100,
          trxPin: '1234',
          userId: 'user123',
          bankCode: '058',
          accountNumber: '0123456789',
          note: 'Transfer',
          recipientName: 'John Doe',
        })
      ).rejects.toThrow('Wallet not found');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('throws if transaction PIN is incorrect', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        balance: 1000,
        trxPin: 'hashed',
        user: new Types.ObjectId(),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        walletService.externalTransfer({
          amount: 100,
          trxPin: 'wrong-pin',
          userId: 'user123',
          bankCode: '058',
          accountNumber: '0123456789',
          note: 'Transfer',
          recipientName: 'John Doe',
        })
      ).rejects.toThrow('Invalid transaction pin');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('throws if insufficient funds', async () => {
      (walletRepo.findByUserId as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        balance: 100,
        trxPin: 'hashed',
        user: new Types.ObjectId(),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        walletService.externalTransfer({
          amount: 500,
          trxPin: '1234',
          userId: 'user123',
          bankCode: '058',
          accountNumber: '0123456789',
          note: 'Transfer',
          recipientName: 'John Doe',
        })
      ).rejects.toThrow('Insufficient funds');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('successfully performs an external transfer', async () => {
      const userId = 'user123';
      const senderId = new Types.ObjectId();
      const userObjId = new Types.ObjectId();

      const sender = {
        _id: senderId,
        balance: 10000,
        trxPin: 'hashed-pin',
        user: userObjId,
      };

      const accountVerificationResult = { status: true };
      const recipient = { recipient_code: 'RCP_123456' };
      const transfer = { reference: 'TRX_987654' };

      const mockTransaction: ITransaction = {
        _id: new Types.ObjectId(),
        note: 'Test transfer',
        amount: 1000,
        user: userObjId,
        wallet: senderId,
        type: TransactionType.DEBIT,
        reference: transfer.reference,
        status: TransactionStatus.PENDING,
        channel: TransactionChannel.EXTERNAL,
        trxCharges: DEFAULT_EXTERNAL_TRX_CHARGES,
        metadata: {
          transfer,
          recipient,
          bankCode: '058',
          accountNumber: '0123456789',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (walletRepo.findByUserId as jest.Mock).mockResolvedValue(sender);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (paystackUtil.verifyAccount as jest.Mock).mockResolvedValue(
        accountVerificationResult
      );
      (paystackUtil.createTransferRecipient as jest.Mock).mockResolvedValue(
        recipient
      );
      (paystackUtil.initiateTransfer as jest.Mock).mockResolvedValue(transfer);
      (walletRepo.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (trxRepo.createTransaction as jest.Mock).mockResolvedValue(
        mockTransaction
      );

      const result = await walletService.externalTransfer({
        amount: 1000,
        trxPin: '1234',
        userId,
        bankCode: '058',
        accountNumber: '0123456789',
        note: 'Test transfer',
        recipientName: 'John Doe',
      });

      expect(walletRepo.findByUserId).toHaveBeenCalledWith(userId, mockSession);
      expect(bcrypt.compare).toHaveBeenCalledWith('1234', 'hashed-pin');
      expect(paystackUtil.verifyAccount).toHaveBeenCalledWith(
        '0123456789',
        '058'
      );
      expect(paystackUtil.createTransferRecipient).toHaveBeenCalledWith({
        bankCode: '058',
        accountNumber: '0123456789',
        name: 'John Doe',
      });
      expect(paystackUtil.initiateTransfer).toHaveBeenCalledWith(
        1000,
        'RCP_123456',
        'Test transfer'
      );
      expect(walletRepo.updateBalance).toHaveBeenCalledWith(
        senderId.toString(),
        userId,
        expect.any(Number), // -amount - charges
        mockSession
      );
      expect(trxRepo.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          type: TransactionType.DEBIT,
          channel: TransactionChannel.EXTERNAL,
        }),
        mockSession
      );

      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getWalletTransactions', () => {
    it('retrieves wallet transactions with filters and pagination', async () => {
      const userId = 'user123';
      const filters = { type: TransactionType.DEBIT };
      const limit = 10;
      const offset = 0;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockTransactions = [
        {
          _id: new Types.ObjectId(),
          amount: 500,
          user: new Types.ObjectId(),
          wallet: new Types.ObjectId(),
          type: TransactionType.DEBIT,
          reference: 'trx_ref_1',
          status: TransactionStatus.SUCCESSFUL,
          channel: TransactionChannel.INTERNAL,
          note: 'Sample transaction',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (trxRepo.findByUser as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await walletService.getWalletTransactions(
        userId,
        filters,
        limit,
        offset,
        startDate,
        endDate
      );

      expect(trxRepo.findByUser).toHaveBeenCalledWith(
        userId,
        filters,
        limit,
        offset,
        startDate,
        endDate
      );

      expect(result).toEqual(mockTransactions);
    });

    it('retrieves all wallet transactions when no filters are provided', async () => {
      const userId = 'user123';
      const mockTransactions = [
        {
          _id: new Types.ObjectId(),
          amount: 300,
          user: new Types.ObjectId(),
          wallet: new Types.ObjectId(),
          type: TransactionType.CREDIT,
          reference: 'trx_ref_2',
          status: TransactionStatus.SUCCESSFUL,
          channel: TransactionChannel.EXTERNAL,
          note: 'No filters',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (trxRepo.findByUser as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await walletService.getWalletTransactions(userId);

      expect(trxRepo.findByUser).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );

      expect(result).toEqual(mockTransactions);
    });

    it('returns empty array when no transactions are found', async () => {
      const userId = 'user123';

      (trxRepo.findByUser as jest.Mock).mockResolvedValue([]);

      const result = await walletService.getWalletTransactions(userId);

      expect(trxRepo.findByUser).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );

      expect(result).toEqual([]);
    });
  });
});
