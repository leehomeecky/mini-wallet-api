import { z } from 'zod';
import { loginSchema, registerSchema } from '../auth.schema';

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
