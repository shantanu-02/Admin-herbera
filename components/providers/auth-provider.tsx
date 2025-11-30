"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        if (response.status === 401) {
          // Check if we are already on the login page to avoid loops
          if (window.location.pathname !== "/") {
            localStorage.removeItem("admin_token");
            toast.error("Session expired. Please login again.");
            router.push("/");
          }
        }

        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);

  return <>{children}</>;
}
