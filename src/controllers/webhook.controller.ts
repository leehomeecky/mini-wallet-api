import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';
import { WalletRepository } from '../repositories/wallet.repository';

const webhookService = new WebhookService(new WalletRepository());

export const handlePaystackWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { event, data } = req.body;

  if (!event || !data?.reference) {
    res.sendStatus(400);
    return;
  }

  try {
    await webhookService.processPaystackTransferWebhook(event, data);
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Webhook error', error: err });
  }
};
