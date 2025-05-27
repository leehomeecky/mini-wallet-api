import mongoose, { FilterQuery, Types } from 'mongoose';
import { ITransaction } from '../interfaces';
import transactionModel, {
  TransactionDocument,
} from '../models/transaction.model';
import { AbstractRepository } from './abstract.repository';
import { DEFAULT_LIMIT } from '../constant';

export interface ITransactionRepository {
  createTransaction(
    data: ITransaction,
    session?: mongoose.ClientSession
  ): Promise<ITransaction>;
  findByUser(
    userId: string,
    filters?: Partial<ITransaction>,
    limit?: number,
    offset?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ data: ITransaction[]; total: number }>;
}

export class TransactionRepository
  extends AbstractRepository<TransactionDocument>
  implements ITransactionRepository
{
  constructor() {
    super(transactionModel);
  }

  async createTransaction(
    data: ITransaction,
    session?: mongoose.ClientSession
  ): Promise<ITransaction> {
    if (!session) return (await this.repository.create(data)).toObject();

    return (
      await this.repository.create([data], { session }).then((docs) => docs[0])
    ).toObject();
  }

  async findByUser(
    userId: string,
    filters: Partial<ITransaction> = {},
    limit = DEFAULT_LIMIT,
    offset = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ data: ITransaction[]; total: number }> {
    const query: FilterQuery<ITransaction> = {
      user: new Types.ObjectId(userId),
      ...filters,
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.repository
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.repository.countDocuments(query),
    ]);

    return { data, total };
  }
}
