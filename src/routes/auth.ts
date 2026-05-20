import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { LoginSchema } from "../schemas";
import { AppError } from "../lib/AppError";

const router = Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw new AppError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwt.secret as jwt.Secret,
    { expiresIn: "1h" }
  );

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    },
  });
});

export { router as authRouter };
