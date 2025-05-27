import mongoose, { Schema, HydratedDocument, Model } from 'mongoose';
import { IUser } from '../interfaces';

export type UserDocument = HydratedDocument<IUser>;

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<UserDocument>('User', UserSchema);
