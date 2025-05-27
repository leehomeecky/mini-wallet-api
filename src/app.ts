import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import webhookRoutes from './routes/webhook.routes';
import { MONGO_URI, PORT } from './config/env.config';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/webhook', webhookRoutes);

app.get('/', (_req, res) => {
  res.send('Mini Wallet API is running!');
});
mongoose
  .connect(MONGO_URI ?? '')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT ?? 5000, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
