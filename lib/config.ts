/**
 * Environment configuration utility
 * Handles both development and production environments
 */

export const config = {
  // Environment
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // App URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  productionUrl: "https://admin.herbera.in",

  // Get the correct app URL based on environment
  getAppUrl: () => {
    if (process.env.NODE_ENV === "production") {
      return process.env.NEXT_PUBLIC_APP_URL || "https://admin.herbera.in";
    }
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },

  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "herberaco@123",
    expiresIn: "24h",
  },

  // Admin Configuration
  admin: {
    email: process.env.ADMIN_EMAIL || "shantanupawar101@gmail.com",
  },

  // Storage Configuration
  storage: {
    bucket: "product-images",
    folder: "products",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    timeout: 30000, // 30 seconds
  },
} as const;

// Validation
if (!config.supabase.url) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!config.supabase.anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

if (!config.supabase.serviceRoleKey) {
  console.warn(
    "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Some features may not work."
  );
}

export default config;
