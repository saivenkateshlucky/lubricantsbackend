import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /api/categories
 * Returns all categories.
 */
router.get("/", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("Categories fetch error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET /api/categories/:slug
 * Returns a single category with its products.
 */
router.get("/:slug", async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { products: { where: { is_active: true } } },
    });

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    res.json({ success: true, data: category });
  } catch (err) {
    console.error("Category fetch error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export { router as categoriesRouter };
