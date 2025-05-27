import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

import { IAuthRepository } from '../repositories/auth.repository';
import * as utils from '../utils';
import { JWT_SECRET } from '../config';
import { AuthService, IAuthService } from '../services/auth.service';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../utils', () => ({
  __esModule: true,
  ...jest.requireActual('../utils'),
  hashValue: jest.fn(),
}));

describe('AuthService', () => {
  let authService: IAuthService;
  let authRepo: jest.Mocked<IAuthRepository>;

  beforeEach(() => {
    authRepo = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    authService = new AuthService(authRepo);
  });

  describe('register', () => {
    it('should throw if email already exists', async () => {
      authRepo.findByEmail.mockResolvedValue({
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'password123',
        })
      ).rejects.toThrow('Email already registered');

      expect(authRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should create user and return id and email', async () => {
      authRepo.findByEmail.mockResolvedValue(null);
      authRepo.createUser.mockResolvedValue({
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'newuser@example.com',
        password: 'hashed-password',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      (utils.hashValue as jest.Mock).mockResolvedValue('hashed-password');

      const result = await authService.register({
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        password: 'password123',
      });

      expect(authRepo.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(utils.hashValue).toHaveBeenCalledWith({ value: 'password123' });
      expect(authRepo.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        password: 'hashed-password',
      });
      expect(result).toEqual({
        id: expect.anything(),
        email: 'newuser@example.com',
      });
    });
  });

  describe('login', () => {
    it('should throw if user not found', async () => {
      authRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'notfound@example.com', password: 'pass' })
      ).rejects.toThrow('Invalid credentials');

      expect(authRepo.findByEmail).toHaveBeenCalledWith('notfound@example.com');
    });

    it('should throw if password does not match', async () => {
      authRepo.findByEmail.mockResolvedValue({
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpass' })
      ).rejects.toThrow('Invalid credentials');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpass',
        'hashed-password'
      );
    });

    it('should return user info and token on successful login', async () => {
      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
      };

      authRepo.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(authRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctpassword',
        'hashed-password'
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id, email: mockUser.email },
        JWT_SECRET ?? '',
        { expiresIn: '1d' }
      );

      expect(result).toEqual({
        user: {
          _id: mockUser._id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
        token: 'mock-jwt-token',
      });
    });
  });
});
