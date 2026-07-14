import { useState, useEffect, useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("carverse_session") : null;
  });

  // Automatically validate session in the background
  const user = useQuery(api.authActions.validateSession, token ? { token } : "skip");
  const logoutMutation = useMutation(api.authActions.logout);

  const isAuthenticated = !!user;
  const isLoading = token !== null && user === undefined;

  const signIn = useCallback((newToken: string) => {
    localStorage.setItem("carverse_session", newToken);
    setToken(newToken);
  }, []);

  const signOut = useCallback(async () => {
    if (token) {
      await logoutMutation({ token });
    }
    localStorage.removeItem("carverse_session");
    setToken(null);
  }, [token, logoutMutation]);

  return {
    isLoading,
    isAuthenticated,
    user,
    token,
    signIn,
    signOut,
  };
}
