import fs from "fs";
import path from "path";

const REVIEWS_PATH = path.join(process.cwd(), "data", "reviews.json");

export interface Review {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessId: string;
  businessName?: string;
  createdAt: string;
}

// Ensure file exists
function ensureFileExists() {
  const dir = path.dirname(REVIEWS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(REVIEWS_PATH)) {
    fs.writeFileSync(REVIEWS_PATH, JSON.stringify([], null, 2));
  }
}

export function getAllReviews(): Review[] {
  ensureFileExists();
  const data = fs.readFileSync(REVIEWS_PATH, "utf-8");
  return JSON.parse(data);
}

function saveReviews(reviews: Review[]) {
  ensureFileExists();
  fs.writeFileSync(REVIEWS_PATH, JSON.stringify(reviews, null, 2));
}

export function getReviewsByBusiness(businessId: string): Review[] {
  const reviews = getAllReviews();
  return reviews.filter((review) => review.businessId === businessId);
}

export function getReviewsByUser(userId: string): Review[] {
  const reviews = getAllReviews();
  return reviews.filter((review) => review.userId === userId);
}

export function createReview(data: {
  rating: number;
  comment: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessId: string;
  businessName?: string;
}): Review {
  const reviews = getAllReviews();

  const newReview: Review = {
    id: crypto.randomUUID(),
    rating: data.rating,
    comment: data.comment,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    businessId: data.businessId,
    businessName: data.businessName,
    createdAt: new Date().toISOString(),
  };

  reviews.push(newReview);
  saveReviews(reviews);

  return newReview;
}

export function deleteReview(id: string, userId: string): boolean {
  const reviews = getAllReviews();
  const review = reviews.find((r) => r.id === id);

  if (!review || review.userId !== userId) {
    return false;
  }

  const filteredReviews = reviews.filter((r) => r.id !== id);
  saveReviews(filteredReviews);

  return true;
}

export function getAverageRating(businessId: string): number {
  const reviews = getReviewsByBusiness(businessId);
  if (reviews.length === 0) return 0;

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}
