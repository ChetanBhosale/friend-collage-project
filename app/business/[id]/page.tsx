"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Star, User as UserIcon, Trash2, Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from "@/components/auth-dialog";
import { useAuth } from "@/contexts/auth-context";
import { authStorage } from "@/lib/auth-storage";
import { toast } from "sonner";

interface Business {
  id: string;
  name: string;
  location: string;
  categoryId: string;
  categoryName?: string;
  createdAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export default function BusinessDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBusinesses, setRelatedBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Auth dialog
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchBusinessAndReviews();
    }
  }, [params.id]);

  const fetchBusinessAndReviews = async () => {
    try {
      const [businessRes, reviewsRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch(`/api/reviews?businessId=${params.id}`),
      ]);

      const businessesData = await businessRes.json();
      const reviewsData = await reviewsRes.json();

      const foundBusiness = businessesData.businesses.find(
        (b: Business) => b.id === params.id
      );

      if (!foundBusiness) {
        toast.error("Business not found");
        router.push("/");
        return;
      }

      setBusiness(foundBusiness);
      setReviews(reviewsData.reviews || []);

      // Get related businesses (same category, excluding current)
      const related = businessesData.businesses
        .filter((b: Business) => b.categoryId === foundBusiness.categoryId && b.id !== foundBusiness.id)
        .slice(0, 4);
      setRelatedBusinesses(related);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load business details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please log in to leave a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const token = authStorage.getToken();
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment,
          businessId: params.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit review");
        return;
      }

      toast.success("Review submitted successfully!");
      setReviews([data.review, ...reviews]);
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Submit review error:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const token = authStorage.getToken();
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete review");
        return;
      }

      toast.success("Review deleted successfully");
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (error) {
      console.error("Delete review error:", error);
      toast.error("Failed to delete review");
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const openAuthDialog = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((review) => {
      distribution[review.rating - 1]++;
    });
    return distribution.reverse();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-6 text-muted-foreground text-lg">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  const ratingDistribution = getRatingDistribution();
  const avgRating = getAverageRating();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user?.email || "")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role === "ADMIN" ? "Administrator" : "User"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {user?.role !== "ADMIN" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <UserIcon className="h-4 w-4 mr-2" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {user?.role === "ADMIN" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => openAuthDialog("login")}>
                  Log in
                </Button>
                <Button onClick={() => openAuthDialog("signup")}>Sign up</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Business Details */}
            <Card className="border-2">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {business.categoryName}
                    </Badge>
                  </div>
                  {reviews.length > 0 && (
                    <div className="text-right bg-primary/5 p-3 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-2xl font-bold">{avgRating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-sm mb-0.5">Location</p>
                    <p className="text-sm text-muted-foreground">{business.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Form */}
            {isAuthenticated && user?.role !== "ADMIN" ? (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Write a Review</CardTitle>
                  <CardDescription className="text-sm">Share your experience with this business</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Your Rating</Label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-7 w-7 ${
                                star <= (hoveredRating || rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comment" className="text-sm">Your Review (Optional)</Label>
                      <Textarea
                        id="comment"
                        placeholder="Tell us about your experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        disabled={submitting}
                        className="resize-none text-sm"
                      />
                    </div>

                    <Button type="submit" disabled={submitting || rating === 0} className="w-full">
                      {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : !isAuthenticated ? (
              <Card className="border-2 border-dashed">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Login to Leave a Review</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You need to be logged in to share your experience
                    </p>
                    <Button asChild>
                      <Link href="/">Go to Login</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Reviews List */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">
                  Customer Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No reviews yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Be the first to review this business!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={review.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getUserInitials(review.userEmail)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{review.userName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-3.5 w-3.5 ${
                                          star <= review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              {isAuthenticated && user?.id === review.userId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteReview(review.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Rating Distribution */}
            {reviews.length > 0 && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars, index) => {
                    const count = ratingDistribution[index];
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 w-12">
                          <span className="text-xs font-medium">{stars}</span>
                          <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Related Businesses */}
            {relatedBusinesses.length > 0 && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4" />
                    Related Businesses
                  </CardTitle>
                  <CardDescription className="text-xs">More in {business.categoryName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedBusinesses.map((relatedBusiness) => (
                    <Link
                      key={relatedBusiness.id}
                      href={`/business/${relatedBusiness.id}`}
                      className="block"
                    >
                      <div className="p-3 rounded-lg border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                        <h4 className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors">
                          {relatedBusiness.name}
                        </h4>
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <p className="line-clamp-2">{relatedBusiness.location}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
