import express from 'express';
import { register, login } from '../controllers/auth.controller';
import { loginSchema, registerSchema } from '../validators';
import { zodValidate } from '../middlewares';

const router = express.Router();

router.post('/login', zodValidate(loginSchema), login);
router.post('/register', zodValidate(registerSchema), register);

export default router;
