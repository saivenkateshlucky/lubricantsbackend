import { z } from "zod";

export const EnquiryCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  message: z.string().min(10),
  product_id: z.string().uuid().optional().nullable(),
});

export const EnquiryUpdateSchema = z.object({
  status: z.enum(["new", "in_progress", "closed"]),
});

export type EnquiryCreateInput = z.infer<typeof EnquiryCreateSchema>;
export type EnquiryUpdateInput = z.infer<typeof EnquiryUpdateSchema>;
