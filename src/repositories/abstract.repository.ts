import { Model, Document, FilterQuery } from 'mongoose';

export abstract class AbstractRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  protected get repository(): Model<T> {
    return this.model;
  }

  async getOneByColumn(filter: FilterQuery<T>): Promise<T | null> {
    return this.repository.findOne(filter).exec();
  }

  async getColumnCount(filter: FilterQuery<T>): Promise<number> {
    return this.repository.countDocuments(filter).exec();
  }
}
