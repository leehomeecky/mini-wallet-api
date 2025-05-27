import { z } from 'zod';
import {
  createWalletSchema,
  externalFundTransferSchema,
  fundWalletSchema,
  internalFundTransferSchema,
  transactionQuerySchema,
} from '../wallet.schema';

export type FundWalletDto = z.infer<typeof fundWalletSchema>;
export type CreateWalletDto = z.infer<typeof createWalletSchema>;
export type TransactionQueryDto = z.infer<typeof transactionQuerySchema>;
export type ExternalTransferDto = z.infer<typeof externalFundTransferSchema>;
export type InternalTransferDto = z.infer<typeof internalFundTransferSchema>;
