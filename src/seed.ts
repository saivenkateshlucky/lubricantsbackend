import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Admin User ──────────────────────────────
  const adminPassword = "Venky9848@";
  const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: "bommidisai123@gmail.com" },
    update: {},
    create: {
      email: "bommidisai123@gmail.com",
      password_hash: passwordHash,
      role: UserRole.admin,
    },
  });

  console.log(`✅ Admin user created: ${admin.email} (${admin.id})`);

  // ── Categories ──────────────────────────────
  const categoriesData = [
    { name: "Grease", slug: "grease" },
    { name: "Engine Oil", slug: "engine-oil" },
    { name: "Hydraulic Oil", slug: "hydraulic-oil" },
    { name: "Gear Oil", slug: "gear-oil" },
  ];

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    console.log(`✅ Category created: ${category.name} (${category.id})`);
  }

  // ── Sample Products and Prices ────────────────
  const engineOil = await prisma.category.findUnique({ where: { slug: "engine-oil" } });
  const hydraulicOil = await prisma.category.findUnique({ where: { slug: "hydraulic-oil" } });

  if (engineOil) {
    const prod1 = await prisma.product.upsert({
      where: { slug: "antigravity-power-stroke-15w-40" },
      update: {},
      create: {
        name: "Antigravity Power Stroke 15W-40",
        slug: "antigravity-power-stroke-15w-40",
        description: "Premium heavy-duty diesel engine oil providing outstanding protection in extreme operating environments.",
        category_id: engineOil.id,
        spec_json: {
          viscosity_grade: "15W-40",
          api_service: "CK-4",
          flash_point: "230°C",
          pour_point: "-33°C"
        },
      }
    });
    console.log(`✅ Product created: ${prod1.name}`);

    // Create initial price
    const dateObj = new Date();
    dateObj.setUTCHours(0, 0, 0, 0);
    await prisma.price.upsert({
      where: {
        product_id_effective_date: {
          product_id: prod1.id,
          effective_date: dateObj
        }
      },
      update: {},
      create: {
        product_id: prod1.id,
        price: 249.99,
        currency: "INR",
        effective_date: dateObj
      }
    });
    console.log(`✅ Price created for: ${prod1.name}`);
  }

  if (hydraulicOil) {
    const prod2 = await prisma.product.upsert({
      where: { slug: "antigravity-hydroflow-iso-46" },
      update: {},
      create: {
        name: "Antigravity HydroFlow ISO 46",
        slug: "antigravity-hydroflow-iso-46",
        description: "High-performance anti-wear hydraulic fluid designed for modern high-pressure industrial systems.",
        category_id: hydraulicOil.id,
        spec_json: {
          viscosity_grade: "ISO 46",
          viscosity_index: "105",
          flash_point: "220°C",
          pour_point: "-30°C"
        },
      }
    });
    console.log(`✅ Product created: ${prod2.name}`);

    // Create initial price
    const dateObj = new Date();
    dateObj.setUTCHours(0, 0, 0, 0);
    await prisma.price.upsert({
      where: {
        product_id_effective_date: {
          product_id: prod2.id,
          effective_date: dateObj
        }
      },
      update: {},
      create: {
        product_id: prod2.id,
        price: 189.50,
        currency: "INR",
        effective_date: dateObj
      }
    });
    console.log(`✅ Price created for: ${prod2.name}`);
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
