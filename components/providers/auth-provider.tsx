"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Decode JWT token without verification (client-side only)
 * This is safe because we're only checking expiration, not validating the signature
 */
function decodeToken(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  // Check if expiration time (in seconds) is less than current time
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Logout user and redirect to login
 */
function logoutUser(router: ReturnType<typeof useRouter>) {
  localStorage.removeItem("admin_token");
  toast.error("Session expired. Please login again.");
  if (window.location.pathname !== "/") {
    router.push("/");
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Check token expiration on mount and periodically
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("admin_token");
      if (token && isTokenExpired(token)) {
        logoutUser(router);
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    // Intercept fetch requests to check token before making API calls
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      // Check token expiration before making requests
      const token = localStorage.getItem("admin_token");
      if (token && isTokenExpired(token)) {
        logoutUser(router);
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "TOKEN_EXPIRED",
              message: "Token expired",
            },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      try {
        const response = await originalFetch(...args);

        if (response.status === 401) {
          // Check if we are already on the login page to avoid loops
          if (window.location.pathname !== "/") {
            logoutUser(router);
          }
        }

        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      clearInterval(interval);
      window.fetch = originalFetch;
    };
  }, [router]);

  return <>{children}</>;
}
