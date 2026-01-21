import { NextRequest, NextResponse } from "next/server";
import { createReview, getAllReviews } from "@/lib/review-db";
import { findBusinessById } from "@/lib/business-db";
import { findUserById } from "@/lib/json-db";
import { verifyToken } from "@/lib/auth";

// GET all reviews or by businessId/userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const userId = searchParams.get("userId");

    const reviews = getAllReviews();

    let filteredReviews = reviews;
    if (businessId) {
      filteredReviews = reviews.filter((r) => r.businessId === businessId);
    } else if (userId) {
      filteredReviews = reviews.filter((r) => r.userId === userId);
    }

    return NextResponse.json({ reviews: filteredReviews }, { status: 200 });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST create review (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    // Verify token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { rating, comment, businessId } = await request.json();

    // Validate input
    if (!rating || !businessId) {
      return NextResponse.json(
        { error: "Rating and business ID are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Verify business exists
    const business = findBusinessById(businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Get user info
    const user = findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const review = createReview({
      rating,
      comment: comment || "",
      userId: user.id,
      userName: user.email.split("@")[0],
      userEmail: user.email,
      businessId,
      businessName: business.name,
    });

    return NextResponse.json(
      { message: "Review created successfully", review },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
