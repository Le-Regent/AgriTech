import { z } from 'zod';

export const collectSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  phoneNumber: z.string().min(9, 'Phone number must be at least 9 characters'),
  externalId: z.string().min(1, 'External ID is required'),
});

export const withdrawSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  phoneNumber: z.string().min(9, 'Phone number must be at least 9 characters'),
  externalId: z.string().min(1, 'External ID is required'),
});

export const statusSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
});

export type CollectInput = z.infer<typeof collectSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type StatusInput = z.infer<typeof statusSchema>;
