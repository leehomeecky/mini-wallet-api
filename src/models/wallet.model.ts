import mongoose, { Document, HydratedDocument, Schema } from 'mongoose';
import { Currency, IWallet } from '../interfaces';

export type WalletDocument = HydratedDocument<IWallet>;

const WalletSchema = new Schema<WalletDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: 'User',
    },
    balance: { type: Number, required: true, default: 0 },
    trxPin: { type: String },
    currency: {
      type: String,
      enum: Object.values(Currency),
      required: true,
      default: Currency.NGN,
    },
  },
  { timestamps: true }
);

export default mongoose.model<WalletDocument>('Wallet', WalletSchema);
