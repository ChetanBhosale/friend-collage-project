import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllBusinesses, getAllCategories, Business, Category } from "@/lib/business-db";
import { getAllReviews, Review } from "@/lib/review-db";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message, businessId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get all data
    const businesses = getAllBusinesses();
    const reviews = getAllReviews();
    const categories = getAllCategories();

    // Calculate average ratings for each business
    const businessesWithRatings = businesses.map((business: Business) => {
      const businessReviews = reviews.filter((r: Review) => r.businessId === business.id);
      const avgRating = businessReviews.length > 0
        ? businessReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / businessReviews.length
        : 0;
      const category = categories.find((c: Category) => c.id === business.categoryId);
      
      return {
        ...business,
        categoryName: category?.name || "Unknown",
        averageRating: avgRating.toFixed(1),
        reviewCount: businessReviews.length,
        reviews: businessReviews.map((r: Review) => ({
          rating: r.rating,
          comment: r.comment,
        })),
      };
    });

    // If asking about specific business
    let contextData = businessesWithRatings;
    if (businessId) {
      const business = businessesWithRatings.find((b: Business & { averageRating: string }) => b.id === businessId);
      if (business) {
        contextData = [business];
      }
    }

    // Create system prompt
    const systemPrompt = `You are a helpful assistant for a business review platform. 
You have access to information about local businesses, their reviews, and ratings.

Here is the business data you can reference:
${JSON.stringify(contextData, null, 2)}

IMPORTANT FORMATTING RULES:
When recommending businesses, you MUST use this exact XML format for each business:

<business>
<data>
<id>business-id-here</id>
<name>Business Name</name>
<location>Full address</location>
<category>Category Name</category>
<rating>4.5</rating>
<reviewCount>10</reviewCount>
</data>
</business>

Example response format:
"Here are some great options for you:

<business>
<data>
<id>biz-001</id>
<name>The Golden Fork</name>
<location>456 Oak Avenue, Downtown District, New York, NY 10001</location>
<category>Restaurants</category>
<rating>4.8</rating>
<reviewCount>5</reviewCount>
</data>
</business>

This restaurant has excellent reviews! One customer said: 'Amazing food and great service!'

<business>
<data>
<id>biz-002</id>
<name>Mama's Italian Kitchen</name>
<location>789 Elm Street, Little Italy, New York, NY 10013</location>
<category>Restaurants</category>
<rating>4.7</rating>
<reviewCount>3</reviewCount>
</data>
</business>

Known for authentic Italian cuisine with generous portions."

RULES:
- Always use the XML format for business recommendations
- Include conversational text between business blocks
- Share relevant review quotes to support recommendations
- If they ask about "best" or "highest rated", prioritize businesses with ratings 4.5+
- Be friendly and helpful
- If asked about a specific business (businessId provided), give detailed information about that business only

User question: ${message}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
