import { Router } from "express";
import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";
import { config } from "../config";
import { authenticate, requireAdmin } from "../middleware";
import { ProductCreateSchema, ProductUpdateSchema, PriceCreateSchema, EnquiryUpdateSchema, UploadSignSchema } from "../schemas";

const router = Router();

// Secure all admin routes
router.use(authenticate, requireAdmin);

/**
 * POST /api/admin/products
 */
router.post("/products", async (req, res) => {
  try {
    const parsed = ProductCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const { name, category_id, description, spec_json, image_url } = parsed.data;

    // Generate a basic slug from the name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        category_id,
        description,
        spec_json: spec_json || undefined,
        image_url,
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error("Admin create product error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * PUT /api/admin/products/:id
 */
router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = ProductUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const updateData = parsed.data;

    // If name is updated, generate new slug (optional behavior)
    if (updateData.name) {
      (updateData as any).slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        spec_json: updateData.spec_json === null ? undefined : updateData.spec_json,
      },
    });

    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Admin update product error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Soft delete by setting is_active = false
 */
router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.update({
      where: { id },
      data: { is_active: false },
    });

    res.json({ success: true, data: product, message: "Product deactivated" });
  } catch (err) {
    console.error("Admin delete product error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/admin/prices
 */
router.post("/prices", async (req, res) => {
  try {
    const parsed = PriceCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const { product_id, price, currency, effective_date } = parsed.data;

    // Normalize effective_date to start of day in UTC, or use current date
    const dateObj = effective_date ? new Date(effective_date) : new Date();
    dateObj.setUTCHours(0, 0, 0, 0);

    // Check if a price already exists for this product and date
    const existingPrice = await prisma.price.findUnique({
      where: {
        product_id_effective_date: {
          product_id,
          effective_date: dateObj,
        },
      },
    });

    if (existingPrice) {
      res.status(409).json({ success: false, message: "A price for this product on this effective date already exists." });
      return;
    }

    await prisma.price.create({
      data: {
        product_id,
        price,
        currency,
        effective_date: dateObj,
      },
    });

    // Fetch the product with its latest price
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      include: {
        prices: {
          orderBy: { effective_date: "desc" },
          take: 1,
        },
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error("Admin create price error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET /api/admin/enquiries
 */
router.get("/enquiries", async (req, res) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
      prisma.enquiry.count({ where }),
    ]);

    res.json({
      success: true,
      data: enquiries,
      meta: {
        total,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error("Enquiries fetch error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * PUT /api/admin/enquiries/:id
 */
router.put("/enquiries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = EnquiryUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    res.json({ success: true, data: enquiry });
  } catch (err) {
    console.error("Admin update enquiry error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/admin/uploads/sign
 */
router.post("/uploads/sign", async (req, res) => {
  try {
    const parsed = UploadSignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const { fileName } = parsed.data;

    // Sanitize file name and prepend timestamp to ensure uniqueness
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniquePath = `${Date.now()}_${sanitizedName}`;

    // Create a signed upload URL valid for 60 seconds
    const { data, error } = await supabase.storage
      .from(config.supabase.bucket)
      .createSignedUploadUrl(uniquePath);

    if (error || !data) {
      console.error("Supabase signed URL error:", error);
      res.status(500).json({ success: false, message: "Failed to generate signed URL" });
      return;
    }

    // Generate the public URL that will be accessible after upload
    const { data: publicUrlData } = supabase.storage
      .from(config.supabase.bucket)
      .getPublicUrl(uniquePath);

    res.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        publicUrl: publicUrlData.publicUrl,
        path: uniquePath,
      },
    });
  } catch (err) {
    console.error("Admin upload sign error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export { router as adminRouter };
