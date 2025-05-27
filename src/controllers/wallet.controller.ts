import { Request, Response } from 'express';
import { WalletRepository } from '../repositories/wallet.repository';
import { WalletService } from '../services/wallet.service';
import {
  CreateWalletDto,
  ExternalTransferDto,
  FundWalletDto,
  InternalTransferDto,
  TransactionQueryDto,
} from '../validators/dto/wallet.dto';
import { TransactionRepository } from '../repositories/transaction.repository';
import { PaystackUtil } from '../utils/paystack.util';

const walletService = new WalletService(
  new PaystackUtil(),
  new WalletRepository(),
  new TransactionRepository()
);

export const createWallet = async (
  req: Request<unknown, null, CreateWalletDto>,
  res: Response
) => {
  try {
    const userId = req.user?._id?.toString()!;
    const payload = { ...req.body, userId };
    const wallet = await walletService.createWallet(payload);

    res.json({ message: 'Wallet created successfully', wallet });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getBanks = async (req: Request, res: Response) => {
  try {
    const banks = await walletService.getBanks();

    res.json(banks);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id?.toString()!;
    const balance = await walletService.getBalance(userId);

    res.json({ balance });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id?.toString()!;
    const wallet = await walletService.getWallet(userId);

    res.json(wallet);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const fundWallet = async (
  req: Request<unknown, null, FundWalletDto>,
  res: Response
) => {
  try {
    const userId = req.user?._id?.toString()!;
    const payload = { ...req.body, userId };
    const wallet = await walletService.fundWallet(payload);

    res.json({ message: 'Wallet funded successfully', wallet });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const internalFundTransfer = async (
  req: Request<unknown, null, InternalTransferDto>,
  res: Response
) => {
  try {
    const userId = req.user?._id?.toString()!;
    const payload = { ...req.body, userId };
    const result = await walletService.internalFundTransfer(payload);

    res.json({ message: 'Transfer successful', ...result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const externalFundTransfer = async (
  req: Request<unknown, null, ExternalTransferDto>,
  res: Response
) => {
  try {
    const userId = req.user?._id?.toString()!;
    const payload = { ...req.body, userId };
    const result = await walletService.externalTransfer(payload);

    res.json({ message: 'Transfer successful', ...result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getTransactions = async (
  req: Request<unknown, null, null, TransactionQueryDto>,
  res: Response
) => {
  try {
    const { type, limit, offset, status, channel, endDate, startDate } =
      req.query;
    const userId = req.user?._id?.toString()!;

    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (channel) filters.channel = channel;

    const { data, total } = await walletService.getWalletTransactions(
      userId,
      filters,
      limit,
      offset,
      startDate,
      endDate
    );

    res.json({
      data,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
