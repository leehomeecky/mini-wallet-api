import { IUser } from '../interfaces';
import { AbstractRepository } from './abstract.repository';
import userModel, { UserDocument } from '../models/user.model';
import { RegisterDto } from '../validators/dto';

export interface IAuthRepository {
  findByEmail(email: string): Promise<IUser | null>;
  createUser(data: RegisterDto): Promise<IUser>;
}

export class AuthRepository
  extends AbstractRepository<UserDocument>
  implements IAuthRepository
{
  constructor() {
    super(userModel);
  }

  async findByEmail(email: string) {
    const userDoc = await this.repository.findOne({ email }).exec();
    const user = userDoc?.toObject()!;
    return user;
  }

  async createUser(data: RegisterDto) {
    const userDoc = await this.repository.create(data);
    const user = userDoc?.toObject();
    return user;
  }
}
