import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "users.json");

export interface User {
  id: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
}

// Ensure data directory and file exist
function ensureDbExists() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
  }
}

// Read all users
export function getAllUsers(): User[] {
  ensureDbExists();
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

// Write all users
function saveUsers(users: User[]) {
  ensureDbExists();
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

// Find user by email
export function findUserByEmail(email: string): User | null {
  const users = getAllUsers();
  return users.find((user) => user.email === email) || null;
}

// Find user by id
export function findUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find((user) => user.id === id) || null;
}

// Create new user
export function createUser(data: {
  email: string;
  password: string;
  role?: "ADMIN" | "USER";
}): User {
  const users = getAllUsers();
  
  const newUser: User = {
    id: crypto.randomUUID(),
    email: data.email,
    password: data.password,
    role: data.role || "USER",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  
  return newUser;
}

// Update user
export function updateUser(id: string, data: Partial<User>): User | null {
  const users = getAllUsers();
  const index = users.findIndex((user) => user.id === id);
  
  if (index === -1) return null;
  
  users[index] = {
    ...users[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  saveUsers(users);
  return users[index];
}

// Delete user
export function deleteUser(id: string): boolean {
  const users = getAllUsers();
  const filteredUsers = users.filter((user) => user.id !== id);
  
  if (filteredUsers.length === users.length) return false;
  
  saveUsers(filteredUsers);
  return true;
}
