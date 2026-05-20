import { z } from "zod";

export const ProductCreateSchema = z.object({
  name: z.string().min(2),
  category_id: z.string().uuid(),
  description: z.string().optional().nullable(),
  spec_json: z.any().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const PriceCreateSchema = z.object({
  product_id: z.string().uuid(),
  price: z.number().positive(),
  currency: z.string().default("INR"),
  effective_date: z.string().optional(), // Expected format: YYYY-MM-DD or ISO string
});

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
export type PriceCreateInput = z.infer<typeof PriceCreateSchema>;

export const UploadSignSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export type UploadSignInput = z.infer<typeof UploadSignSchema>;
