import { z } from 'zod';

export const diagnoseSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
  cropType: z.string().default('crop'),
  weatherContext: z.string().optional(),
});

export type DiagnoseInput = z.infer<typeof diagnoseSchema>;
