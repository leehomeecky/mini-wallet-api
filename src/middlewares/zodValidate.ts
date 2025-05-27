import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

export const zodValidate =
  (schema: ZodSchema<any>, part: RequestPart = 'body') =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataToValidate = req[part];
      const result = await schema.safeParseAsync(dataToValidate);
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        res.status(422).json({ errors });
        return;
      }

      if (part === 'query' || part === 'params') {
        (req as any)[
          `validated${part.charAt(0).toUpperCase() + part.slice(1)}`
        ] = result.data;
      } else {
        req.body = result.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
