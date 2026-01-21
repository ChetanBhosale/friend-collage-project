import fs from "fs";
import path from "path";

const CATEGORIES_PATH = path.join(process.cwd(), "data", "categories.json");
const BUSINESSES_PATH = path.join(process.cwd(), "data", "businesses.json");

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  location: string;
  categoryId: string;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

// Ensure files exist
function ensureFileExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
}

// CATEGORIES
export function getAllCategories(): Category[] {
  ensureFileExists(CATEGORIES_PATH);
  const data = fs.readFileSync(CATEGORIES_PATH, "utf-8");
  return JSON.parse(data);
}

function saveCategories(categories: Category[]) {
  ensureFileExists(CATEGORIES_PATH);
  fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categories, null, 2));
}

export function findCategoryById(id: string): Category | null {
  const categories = getAllCategories();
  return categories.find((cat) => cat.id === id) || null;
}

export function findCategoryByName(name: string): Category | null {
  const categories = getAllCategories();
  return categories.find((cat) => cat.name.toLowerCase() === name.toLowerCase()) || null;
}

export function createCategory(name: string): Category {
  const categories = getAllCategories();
  
  const newCategory: Category = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  };

  categories.push(newCategory);
  saveCategories(categories);
  
  return newCategory;
}

export function deleteCategory(id: string): boolean {
  const categories = getAllCategories();
  const filteredCategories = categories.filter((cat) => cat.id !== id);
  
  if (filteredCategories.length === categories.length) return false;
  
  saveCategories(filteredCategories);
  return true;
}

// BUSINESSES
export function getAllBusinesses(): Business[] {
  ensureFileExists(BUSINESSES_PATH);
  const data = fs.readFileSync(BUSINESSES_PATH, "utf-8");
  const businesses = JSON.parse(data);
  
  // Enrich with category names
  const categories = getAllCategories();
  return businesses.map((business: Business) => {
    const category = categories.find((cat) => cat.id === business.categoryId);
    return {
      ...business,
      categoryName: category?.name || "Unknown",
    };
  });
}

function saveBusinesses(businesses: Business[]) {
  ensureFileExists(BUSINESSES_PATH);
  fs.writeFileSync(BUSINESSES_PATH, JSON.stringify(businesses, null, 2));
}

export function findBusinessById(id: string): Business | null {
  const businesses = getAllBusinesses();
  return businesses.find((biz) => biz.id === id) || null;
}

export function getBusinessesByCategory(categoryId: string): Business[] {
  const businesses = getAllBusinesses();
  return businesses.filter((biz) => biz.categoryId === categoryId);
}

export function createBusiness(data: {
  name: string;
  location: string;
  categoryId: string;
}): Business {
  const businesses = getAllBusinesses();
  
  const newBusiness: Business = {
    id: crypto.randomUUID(),
    name: data.name,
    location: data.location,
    categoryId: data.categoryId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  businesses.push(newBusiness);
  saveBusinesses(businesses);
  
  return newBusiness;
}

export function updateBusiness(id: string, data: Partial<Business>): Business | null {
  const businesses = getAllBusinesses();
  const index = businesses.findIndex((biz) => biz.id === id);
  
  if (index === -1) return null;
  
  businesses[index] = {
    ...businesses[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  saveBusinesses(businesses);
  return businesses[index];
}

export function deleteBusiness(id: string): boolean {
  const businesses = getAllBusinesses();
  const filteredBusinesses = businesses.filter((biz) => biz.id !== id);
  
  if (filteredBusinesses.length === businesses.length) return false;
  
  saveBusinesses(filteredBusinesses);
  return true;
}
