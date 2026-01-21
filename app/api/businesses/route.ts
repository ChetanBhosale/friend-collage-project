import { NextRequest, NextResponse } from "next/server";
import { getAllBusinesses, createBusiness, findCategoryById } from "@/lib/business-db";
import { verifyToken } from "@/lib/auth";

// GET all businesses
export async function GET() {
  try {
    const businesses = getAllBusinesses();
    return NextResponse.json({ businesses }, { status: 200 });
  } catch (error) {
    console.error("Get businesses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

// POST create business (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { name, location, categoryId } = await request.json();

    // Validate input
    if (!name || !location || !categoryId) {
      return NextResponse.json(
        { error: "Name, location, and category are required" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = findCategoryById(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const business = createBusiness({
      name: name.trim(),
      location: location.trim(),
      categoryId,
    });

    return NextResponse.json(
      { message: "Business created successfully", business },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create business error:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}
