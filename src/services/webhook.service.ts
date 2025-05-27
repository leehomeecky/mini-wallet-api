import mongoose from 'mongoose';
import {
  IWalletRepository,
  WalletRepository,
} from '../repositories/wallet.repository';
import transactionModel from '../models/transaction.model';
import {
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../interfaces';
import { generateTransactionRef } from '../utils';

export interface IWebhookService {
  processPaystackTransferWebhook(event: string, data: any): Promise<void>;
}

export class WebhookService implements IWebhookService {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async processPaystackTransferWebhook(
    event: string,
    data: any
  ): Promise<void> {
    const reference = data.reference;
    if (!reference) throw new Error('Missing reference');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await transactionModel
        .findOne({ reference })
        .session(session);
      if (!transaction) throw new Error('Transaction not found');

      if (event === 'transfer.success') {
        transaction.status = TransactionStatus.SUCCESSFUL;
        await transaction.save({ session });
      }

      if (event === 'transfer.failed') {
        transaction.status = TransactionStatus.FAILED;
        await transaction.save({ session });

        const totalTrxCharges = Object.values(transaction.trxCharges!).reduce(
          (sum, val) => sum + val,
          0
        );
        const totalCreditAmount = transaction.amount + totalTrxCharges;

        await this.walletRepo.updateBalance(
          transaction.wallet.toString(),
          transaction.user.toString(),
          totalCreditAmount,
          session
        );

        await transactionModel.create(
          [
            {
              user: transaction.user,
              wallet: transaction.wallet,
              amount: transaction.amount,
              type: TransactionType.REFUND,
              reference: generateTransactionRef(),
              status: TransactionStatus.SUCCESSFUL,
              channel: TransactionChannel.INTERNAL,
              metadata: {
                reason: 'Auto-refund for failed transfer',
                originalRef: reference,
              },
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}
