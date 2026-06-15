import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100, 'Name is too long'),
  price: z.number().positive('Price must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  image_url: z.string().url().optional(),
  certifications: z.array(z.string()).optional(),
  harvest_season: z.string().optional(),
  health_status: z.enum(['Perfect', 'Good', 'Warning', 'N/A']).default('N/A'),
});

export type ProductInput = z.infer<typeof productSchema>;
