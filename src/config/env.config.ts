import dotenv from 'dotenv';

dotenv.config();

export const {
  PORT,
  MONGO_URI,
  JWT_SECRET,
  PAYSTACK_BASE_URL,
  PAYSTACK_SECRET_KEY,
} = process.env;
