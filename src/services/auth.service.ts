import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthRepository } from '../repositories/auth.repository';
import { LoginDto, RegisterDto } from '../validators/dto';
import { JWT_SECRET } from '../config';
import { hashValue } from '../utils';
import { IUser } from '../interfaces';

export interface IAuthService {
  register(args: RegisterDto): Promise<{ id: any; email: string }>;
  login(
    args: LoginDto
  ): Promise<{ user: Omit<IUser, 'password'>; token: string }>;
}

export class AuthService implements IAuthService {
  constructor(private readonly authRepo: IAuthRepository) {}

  async register(args: RegisterDto) {
    const { email, lastName, firstName, password } = args;
    const existingUser = await this.authRepo.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await hashValue({ value: password });
    const newUser = await this.authRepo.createUser({
      email,
      lastName,
      firstName,
      password: passwordHash,
    });

    return { id: newUser._id, email: newUser.email };
  }

  async login(args: LoginDto) {
    const { email, password } = args;
    const user = await this.authRepo.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET ?? '',
      {
        expiresIn: '1d',
      }
    );

    const { password: _removed, ...safeUser } = user;
    return { user: safeUser, token };
  }
}
