import mongoose, { Types } from 'mongoose';
import walletModel, { WalletDocument } from '../models/wallet.model';
import { AbstractRepository } from './abstract.repository';
import { IWallet } from '../interfaces';
import { CreateWalletDto } from '../validators/dto/wallet.dto';
import { hashValue } from '../utils';

export interface IWalletRepository {
  findByUserId(
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<IWallet | null>;
  updateBalance(
    walletId: string,
    userId: string,
    amount: number,
    session?: mongoose.ClientSession
  ): Promise<IWallet | null>;
  createWallet(data: CreateWalletDto & { userId: string }): Promise<IWallet>;
}

export class WalletRepository
  extends AbstractRepository<WalletDocument>
  implements IWalletRepository
{
  constructor() {
    super(walletModel);
  }

  async findByUserId(
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<IWallet | null> {
    const user = new Types.ObjectId(userId);
    const query = this.repository.findOne({ user });

    if (session) query.session(session);
    const walletDoc = await query.exec();

    return walletDoc?.toObject()!;
  }

  async createWallet(
    data: CreateWalletDto & { userId: string }
  ): Promise<IWallet> {
    const { userId, trxPin, currency } = data;

    const hashTrxPin = await hashValue({ value: trxPin });
    const user = new Types.ObjectId(userId);
    const walletDoc = await this.repository.create({
      user,
      currency,
      trxPin: hashTrxPin,
    });
    const wallet = walletDoc?.toObject();
    return wallet;
  }

  async updateBalance(
    walletId: string,
    userId: string,
    amount: number,
    session?: mongoose.ClientSession
  ): Promise<IWallet | null> {
    const _id = new Types.ObjectId(walletId);
    const user = new Types.ObjectId(userId);

    const walletDoc = await this.repository
      .findOneAndUpdate(
        { user, _id },
        { $inc: { balance: amount } },
        { new: true, session }
      )
      .exec();

    return walletDoc?.toObject()!;
  }
}
