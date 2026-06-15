import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Please select a category'),
  price: z.number().positive('Price must be greater than zero'),
  unit: z.string().min(1, 'Please specify a unit'),
  stock_quantity: z.number().int().min(0, 'Stock cannot be negative'),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  min_quantity: z.number().min(1).optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;
