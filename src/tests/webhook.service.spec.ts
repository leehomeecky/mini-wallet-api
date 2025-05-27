import mongoose from 'mongoose';
import transactionModel from '../models/transaction.model';
import { WebhookService } from '../services/webhook.service';
import {
  IWalletRepository,
  WalletRepository,
} from '../repositories/wallet.repository';
import {
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../interfaces';
import { generateTransactionRef } from '../utils';

jest.mock('../utils', () => ({
  generateTransactionRef: jest.fn(() => 'refund-ref-001'),
}));

jest.mock('../models/transaction.model');
jest.mock('../repositories/wallet.repository');

const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest
  .spyOn(mongoose, 'startSession')
  .mockImplementation(() => Promise.resolve(mockSession as any));

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockWalletRepo: jest.Mocked<IWalletRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletRepo = new WalletRepository() as jest.Mocked<WalletRepository>;
    webhookService = new WebhookService(mockWalletRepo);
    (webhookService as any).walletRepo = mockWalletRepo;
  });

  it('should mark transaction as successful on transfer.success', async () => {
    const mockTransaction = {
      status: TransactionStatus.PENDING,
      save: jest.fn(),
    };

    (transactionModel.findOne as jest.Mock).mockReturnValueOnce({
      session: () => Promise.resolve(mockTransaction),
    });

    await webhookService.processPaystackTransferWebhook('transfer.success', {
      reference: 'trx-123',
    });

    expect(mockTransaction.status).toBe(TransactionStatus.SUCCESSFUL);
    expect(mockTransaction.save).toHaveBeenCalledWith({ session: mockSession });
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should mark transaction as failed and create refund transaction on transfer.failed', async () => {
    const mockTransaction = {
      amount: 500,
      user: new mongoose.Types.ObjectId(),
      wallet: new mongoose.Types.ObjectId(),
      reference: 'trx-123',
      trxCharges: { service: 20, processing: 30 },
      status: TransactionStatus.PENDING,
      save: jest.fn(),
    };

    (transactionModel.findOne as jest.Mock).mockReturnValueOnce({
      session: () => Promise.resolve(mockTransaction),
    });

    await webhookService.processPaystackTransferWebhook('transfer.failed', {
      reference: 'trx-123',
    });

    expect(mockTransaction.status).toBe(TransactionStatus.FAILED);
    expect(mockTransaction.save).toHaveBeenCalledWith({ session: mockSession });

    const totalRefund = 550;
    expect(mockWalletRepo.updateBalance).toHaveBeenCalledWith(
      mockTransaction.wallet.toString(),
      mockTransaction.user.toString(),
      totalRefund,
      mockSession
    );

    expect(transactionModel.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          amount: 500,
          type: TransactionType.REFUND,
          reference: 'refund-ref-001',
          status: TransactionStatus.SUCCESSFUL,
          channel: TransactionChannel.INTERNAL,
          metadata: {
            reason: 'Auto-refund for failed transfer',
            originalRef: 'trx-123',
          },
        }),
      ],
      { session: mockSession }
    );

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if reference is missing', async () => {
    await expect(
      webhookService.processPaystackTransferWebhook('transfer.success', {})
    ).rejects.toThrow('Missing reference');

    expect(mockSession.abortTransaction).not.toHaveBeenCalled();
    expect(mockSession.endSession).not.toHaveBeenCalled();
  });

  it('should abort transaction and rethrow error if transaction not found', async () => {
    (transactionModel.findOne as jest.Mock).mockReturnValueOnce({
      session: () => Promise.resolve(null),
    });

    await expect(
      webhookService.processPaystackTransferWebhook('transfer.success', {
        reference: 'missing-ref',
      })
    ).rejects.toThrow('Transaction not found');

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });
});
