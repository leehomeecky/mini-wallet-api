import express from 'express';
import {
  getBalance,
  fundWallet,
  internalFundTransfer,
  externalFundTransfer,
  getTransactions,
  createWallet,
  getBanks,
  getWallet,
} from '../controllers/wallet.controller';
import { authenticate, zodValidate } from '../middlewares';
import {
  createWalletSchema,
  externalFundTransferSchema,
  fundWalletSchema,
  internalFundTransferSchema,
  transactionQuerySchema,
} from '../validators/wallet.schema';

const router = express.Router();

router.use(authenticate);

router.get('/', getWallet);
router.get('/bank', getBanks);
router.get('/balance', getBalance);
router.post('/', zodValidate(createWalletSchema), createWallet);
router.post('/fund', zodValidate(fundWalletSchema), fundWallet);

router.post(
  '/transfer',
  zodValidate(internalFundTransferSchema),
  internalFundTransfer
);
router.post(
  '/transfer/bank',
  zodValidate(externalFundTransferSchema),
  externalFundTransfer
);
router.get(
  '/transactions',
  zodValidate(transactionQuerySchema, 'query'),
  getTransactions
);

export default router;
