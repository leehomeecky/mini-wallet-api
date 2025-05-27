import { z } from 'zod';
import {
  currencyValidation,
  pastDate,
  pinSchema,
  stringToInt,
  trxChannelValidation,
  trxStatusValidation,
  trxTypeValidation,
} from './common.schema';

export const createWalletSchema = z.object({
  trxPin: pinSchema,
  currency: currencyValidation.optional(),
});

export const fundWalletSchema = z.object({
  walletId: z.string().nonempty(),
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
});

export const internalFundTransferSchema = z.object({
  trxPin: pinSchema,
  note: z.string().optional(),
  toUserId: z.string().nonempty({ message: 'Recipient userId is required' }),
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
});

export const externalFundTransferSchema = z.object({
  trxPin: pinSchema,
  note: z.string().optional(),
  bankCode: z.string().min(3, 'Bank code is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  recipientName: z.string().min(2, 'Recipient name is required'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits'),
});

export const transactionQuerySchema = z.object({
  endDate: pastDate.optional(),
  limit: stringToInt.optional(),
  offset: stringToInt.optional(),
  startDate: pastDate.optional(),
  type: trxTypeValidation.optional(),
  status: trxStatusValidation.optional(),
  channel: trxChannelValidation.optional(),
});
