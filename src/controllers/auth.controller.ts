import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginDto, RegisterDto } from '../validators/dto';

const authService = new AuthService(new AuthRepository());

export const register = async (
  req: Request<unknown, null, RegisterDto>,
  res: Response
) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (
  req: Request<unknown, null, LoginDto>,
  res: Response
) => {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};
