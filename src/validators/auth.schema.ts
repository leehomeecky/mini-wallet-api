import { z } from 'zod';
import { passwordSchema } from './common.schema';

export const registerSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  password: passwordSchema,
  email: z.string().email(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
