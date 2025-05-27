import { Types } from 'mongoose';
import { UserDocument } from '../models/user.model';
import { IBaseModel } from './common.interface';

export enum Currency {
  NGN = 'NGN',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
  CNY = 'CNY',
  INR = 'INR',
  ZAR = 'ZAR',
}

export interface IWallet extends IBaseModel {
  balance: number;
  trxPin?: string;
  currency: Currency;
  _id?: Types.ObjectId;
  user: UserDocument | Types.ObjectId;
}
