import { Types } from 'mongoose';
import { UserDocument } from '../models/user.model';
import { WalletDocument } from '../models/wallet.model';
import { IBaseModel } from './common.interface';

export enum TransactionChannel {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
  INTERNATIONAL = 'INTERNATIONAL',
}

export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  REFUND = 'REFUND',
  CHARGES = 'CHARGES',
}
export enum TransactionStatus {
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
}

export interface ITrxCharges {
  vat: number;
  fees: number;
  stampDuty: number;
}

export interface ITransaction extends IBaseModel {
  note?: string;
  amount: number;
  reference: string;
  metadata?: unknown;
  _id?: Types.ObjectId;
  type: TransactionType;
  trxCharges?: ITrxCharges;
  status: TransactionStatus;
  channel: TransactionChannel;
  user: UserDocument | Types.ObjectId;
  wallet: WalletDocument | Types.ObjectId;
}
