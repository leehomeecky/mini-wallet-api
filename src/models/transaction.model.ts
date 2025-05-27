import mongoose, { Schema, HydratedDocument, Types } from 'mongoose';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
  TransactionChannel,
} from '../interfaces/transaction.interface';

export type TransactionDocument = HydratedDocument<ITransaction>;

const TrxChargesSchema = new Schema(
  {
    vat: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    stampDuty: { type: Number, default: 0 },
  },
  { _id: false }
);

const TransactionSchema = new Schema<TransactionDocument>(
  {
    amount: { type: Number, required: true },
    reference: { type: String, required: true, unique: true },
    note: { type: String },
    metadata: { type: Schema.Types.Mixed },
    channel: {
      type: String,
      enum: Object.values(TransactionChannel),
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    trxCharges: { type: TrxChargesSchema },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: true,
    },
    user: { type: Types.ObjectId, ref: 'User', required: true },
    wallet: { type: Types.ObjectId, ref: 'Wallet', required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<TransactionDocument>(
  'Transaction',
  TransactionSchema
);
