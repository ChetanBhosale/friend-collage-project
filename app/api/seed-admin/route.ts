import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "@/lib/json-db";

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = findUserByEmail("admin@gmail.com");

    if (existingAdmin) {
      return NextResponse.json(
        { message: "Admin account already exists" },
        { status: 200 }
      );
    }

    // Create admin account
    const hashedPassword = await bcrypt.hash("admin1234", 10);

    const admin = createUser({
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
    });

    return NextResponse.json(
      {
        message: "Admin account created successfully!",
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seed admin error:", error);
    return NextResponse.json(
      { error: "Failed to create admin account", details: String(error) },
      { status: 500 }
    );
  }
}
