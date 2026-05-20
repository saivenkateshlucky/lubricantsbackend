import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /api/products
 * Query: ?category=slug&page=1&limit=12
 */
router.get("/", async (req, res) => {
  try {
    const { category, page = "1", limit = "12" } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    const where: Record<string, unknown> = { is_active: true };
    if (category) {
      where.category = { slug: category };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          prices: {
            orderBy: { effective_date: "desc" },
            take: 1,
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      meta: {
        total,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error("Products fetch error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET /api/products/:slug
 */
router.get("/:slug", async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, is_active: true },
      include: {
        category: true,
        prices: { orderBy: { effective_date: "desc" }, take: 1 },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Product fetch error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export { router as productsRouter };
