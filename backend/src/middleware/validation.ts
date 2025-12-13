import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Validation middleware factory
export const validate = (schema: z.ZodObject<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errorMessages,
        });
      }
      next(error);
    }
  };
};

// Query parameter schemas
export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be greater than 0' })
      .refine((val) => val <= 1000, { message: 'Page must be 1000 or less' }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0, { message: 'Limit must be greater than 0' })
      .refine((val) => val <= 100, { message: 'Limit must be 100 or less' }),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

// Photo ID parameter schema
export const photoIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid photo ID format' }),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

// Moderation action schema
export const moderationActionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid photo ID format' }),
  }),
  body: z.object({
    action: z.enum(['approve', 'reject'], {
      errorMap: () => ({ message: 'Action must be "approve" or "reject"' }),
    }),
    reason: z.string().max(500).optional(),
  }),
  query: z.object({}).optional(),
});

// Auth login schema
export const loginSchema = z.object({
  body: z.object({
    password: z.string().min(1, { message: 'Password is required' }),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
