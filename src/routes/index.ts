import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { categoriesRouter } from "./categories";
import { productsRouter } from "./products";
import { enquiriesRouter } from "./enquiries";

import { adminRouter } from "./admin";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/enquiries", enquiriesRouter);
router.use("/admin", adminRouter);

export { router as apiRouter };
