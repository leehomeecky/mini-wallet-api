import { z } from 'zod';
import {
  Currency,
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../interfaces';
import moment from 'moment';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must include uppercase, lowercase, number, and special character'
  );

export const stringToInt = z.string().transform((value, ctx) => {
  const parsedValue = parseInt(value);
  if (isNaN(parsedValue)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be a valid number',
    });
  }
  return parsedValue;
});

export const pinSchema = z
  .string()
  .min(4)
  .max(4)
  .refine((val) => /^\d{4}$/.test(val), {
    message: 'must be a 4-digit number',
  });

export const stringToFloat = z.string().transform((value, ctx) => {
  const parsedValue = parseFloat(value);
  if (isNaN(parsedValue)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be a valid number',
    });
  }
  return parsedValue;
});

export const stringToDate = z.string().transform((value, ctx) => {
  const date = moment(value);
  if (!date.isValid()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be a valid date string',
    });
  }
  return date.toDate();
});

export const futureDate = stringToDate.refine(
  (date) => moment(date).isSameOrAfter(moment(), 'day'),
  {
    message: 'must be greater or equals to today',
  }
);

export const pastDate = stringToDate.refine(
  (date) => moment(date).isSameOrBefore(moment(), 'day'),
  {
    message: 'date must be lesser or equals to today',
  }
);

export const currencyValidation = z.enum([
  Currency.AUD,
  Currency.CAD,
  Currency.CNY,
  Currency.EUR,
  Currency.GBP,
  Currency.INR,
  Currency.JPY,
  Currency.NGN,
  Currency.USD,
  Currency.ZAR,
]);

export const trxTypeValidation = z.enum([
  TransactionType.DEBIT,
  TransactionType.CREDIT,
  TransactionType.REFUND,
  TransactionType.CHARGES,
]);

export const trxChannelValidation = z.enum([
  TransactionChannel.EXTERNAL,
  TransactionChannel.INTERNAL,
  TransactionChannel.INTERNATIONAL,
]);

export const trxStatusValidation = z.enum([
  TransactionStatus.FAILED,
  TransactionStatus.PENDING,
  TransactionStatus.SUCCESSFUL,
]);
