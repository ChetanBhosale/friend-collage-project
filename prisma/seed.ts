import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@gmail.com" },
  });

  if (existingAdmin) {
    console.log("✅ Admin account already exists");
    return;
  }

  // Create admin account
  const hashedPassword = await bcrypt.hash("admin1234", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin account created successfully!");
  console.log("📧 Email: admin@gmail.com");
  console.log("🔑 Password: admin1234");
  console.log("👤 Role: ADMIN");
  console.log(`🆔 ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
