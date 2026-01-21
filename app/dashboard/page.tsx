"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Plus,
  Trash2,
  Building2,
  Tag,
  ArrowLeft,
  MoreVertical,
  Edit,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { authStorage } from "@/lib/auth-storage";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
  location: string;
  categoryId: string;
  categoryName?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Business dialog
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [businessForm, setBusinessForm] = useState({
    name: "",
    location: "",
    categoryId: "",
  });
  const [businessLoading, setBusinessLoading] = useState(false);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "category" | "business";
    id: string;
    name: string;
  }>({ open: false, type: "category", id: "", name: "" });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      const [categoriesRes, businessesRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/businesses"),
      ]);

      const categoriesData = await categoriesRes.json();
      const businessesData = await businessesRes.json();

      setCategories(categoriesData.categories || []);
      setBusinesses(businessesData.businesses || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "" });
    }
    setCategoryDialogOpen(true);
  };

  const openBusinessDialog = (business?: Business) => {
    if (business) {
      setEditingBusiness(business);
      setBusinessForm({
        name: business.name,
        location: business.location,
        categoryId: business.categoryId,
      });
    } else {
      setEditingBusiness(null);
      setBusinessForm({ name: "", location: "", categoryId: "" });
    }
    setBusinessDialogOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    setCategoryLoading(true);
    try {
      const token = authStorage.getToken();
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: categoryForm.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create category");
        return;
      }

      toast.success(data.message);
      setCategories([...categories, data.category]);
      setCategoryDialogOpen(false);
      setCategoryForm({ name: "" });
    } catch (error) {
      console.error("Create category error:", error);
      toast.error("Failed to create category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessForm.name || !businessForm.location || !businessForm.categoryId) {
      toast.error("All fields are required");
      return;
    }

    setBusinessLoading(true);
    try {
      const token = authStorage.getToken();
      const url = editingBusiness
        ? `/api/businesses/${editingBusiness.id}`
        : "/api/businesses";
      const method = editingBusiness ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(businessForm),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to save business");
        return;
      }

      toast.success(data.message);

      if (editingBusiness) {
        setBusinesses(
          businesses.map((b) => (b.id === editingBusiness.id ? data.business : b))
        );
      } else {
        setBusinesses([...businesses, data.business]);
      }

      setBusinessDialogOpen(false);
      setBusinessForm({ name: "", location: "", categoryId: "" });
      setEditingBusiness(null);
    } catch (error) {
      console.error("Save business error:", error);
      toast.error("Failed to save business");
    } finally {
      setBusinessLoading(false);
    }
  };

  const handleDelete = async () => {
    const { type, id } = deleteDialog;
    try {
      const token = authStorage.getToken();
      const endpoint = type === "category" ? `/api/categories/${id}` : `/api/businesses/${id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || `Failed to delete ${type}`);
        return;
      }

      toast.success(data.message);

      if (type === "category") {
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        setBusinesses(businesses.filter((b) => b.id !== id));
      }

      setDeleteDialog({ open: false, type: "category", id: "", name: "" });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${deleteDialog.type}`);
    }
  };

  const filteredBusinesses = businesses.filter(
    (business) =>
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Star className="h-8 w-8 fill-primary text-primary" />
                <span className="text-2xl font-bold">ShopNextDoor</span>
              </Link>
              <Badge variant="secondary" className="hidden sm:flex">
                <LayoutDashboard className="h-3 w-3 mr-1" />
                Admin Dashboard
              </Badge>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, Admin</h1>
          <p className="text-muted-foreground text-lg">
            Manage your platform's categories and businesses
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Active categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businesses.length}</div>
              <p className="text-xs text-muted-foreground">Listed businesses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average per Category</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categories.length > 0 ? (businesses.length / categories.length).toFixed(1) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Businesses per category</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Categories</CardTitle>
                <CardDescription>Manage your business categories</CardDescription>
              </div>
              <Button onClick={() => openCategoryDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first category to start organizing businesses
                </p>
                <Button onClick={() => openCategoryDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Businesses</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const businessCount = businesses.filter(
                      (b) => b.categoryId === category.id
                    ).length;
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{businessCount}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    type: "category",
                                    id: category.id,
                                    name: category.name,
                                  })
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Businesses Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Businesses</CardTitle>
                <CardDescription>Manage your business listings</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-[250px]"
                  />
                </div>
                <Button onClick={() => openBusinessDialog()} disabled={categories.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {businesses.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No businesses yet</h3>
                <p className="text-muted-foreground mb-4">
                  {categories.length === 0
                    ? "Create a category first to add businesses"
                    : "Add your first business to get started"}
                </p>
                <Button onClick={() => openBusinessDialog()} disabled={categories.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBusinesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">{business.name}</TableCell>
                      <TableCell className="text-muted-foreground">{business.location}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{business.categoryName}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(business.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openBusinessDialog(business)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "business",
                                  id: business.id,
                                  name: business.name,
                                })
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category information"
                : "Create a new category for organizing businesses"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  placeholder="e.g., Restaurants, Hotels, Cafes"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                  required
                  disabled={categoryLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
                disabled={categoryLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={categoryLoading}>
                {categoryLoading ? "Saving..." : editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Business Dialog */}
      <Dialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingBusiness ? "Edit Business" : "Add New Business"}
            </DialogTitle>
            <DialogDescription>
              {editingBusiness
                ? "Update the business information"
                : "Add a new business to your platform"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBusinessSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Joe's Pizza"
                  value={businessForm.name}
                  onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  required
                  disabled={businessLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Textarea
                  id="location"
                  placeholder="e.g., 123 Main St, New York, NY 10001"
                  value={businessForm.location}
                  onChange={(e) => setBusinessForm({ ...businessForm, location: e.target.value })}
                  required
                  disabled={businessLoading}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={businessForm.categoryId}
                  onValueChange={(value) =>
                    setBusinessForm({ ...businessForm, categoryId: value })
                  }
                  disabled={businessLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBusinessDialogOpen(false);
                  setEditingBusiness(null);
                }}
                disabled={businessLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={businessLoading}>
                {businessLoading ? "Saving..." : editingBusiness ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteDialog.type}{" "}
              <span className="font-semibold">{deleteDialog.name}</span>.
              {deleteDialog.type === "category" &&
                " All businesses in this category will need to be reassigned."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
