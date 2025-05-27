import { Types } from 'mongoose';
import { IBaseModel } from './common.interface';

export interface IUser extends IBaseModel {
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  _id?: Types.ObjectId;
}
