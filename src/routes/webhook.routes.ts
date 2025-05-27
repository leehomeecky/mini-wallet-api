import express from 'express';
import { handlePaystackWebhook } from '../controllers/webhook.controller';

const router = express.Router();

router.post(
  '/paystack',
  express.json({ verify: rawBodySaver }),
  handlePaystackWebhook
);

export default router;

function rawBodySaver(req: any, res: any, buf: Buffer) {
  req.rawBody = buf;
}
