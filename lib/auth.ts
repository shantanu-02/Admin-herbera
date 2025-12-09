import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./supabase";
import { config } from "./config";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AdminUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function verifyToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if a JWT token is expired (client-side utility)
 * This decodes the token without verification to check expiration
 */
export function isTokenExpired(token: string): boolean {
  try {
    // Decode without verification (client-side)
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    // Check if expiration time (in seconds) is less than current time
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminUser | null> {
  try {
    if (!supabaseAdmin) {
      console.error("Supabase admin client not available");
      return null;
    }

    // First, authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return null;
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      console.error("Profile error or not admin:", profileError, profile);
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name || undefined,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export async function verifyAdminToken(
  authHeader: string | null
): Promise<AdminUser | null> {
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return null;
  }

  const user = verifyToken(token);
  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}

// Helper function to create admin user (for setup)
export async function createAdminUser(
  email: string,
  password: string,
  fullName?: string
) {
  try {
    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not available");
    }

    // Create user in auth.users
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (authError || !authData.user) {
      throw authError;
    }

    // Update profile to set role as admin
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: "admin",
        full_name: fullName,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      throw profileError;
    }

    return {
      id: authData.user.id,
      email: authData.user.email!,
      role: "admin",
      full_name: fullName,
    };
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}
