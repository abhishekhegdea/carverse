import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { useAuth } from "./use-auth";

export function useQuery(apiMethod: any, args: any = {}) {
  const { token } = useAuth();
  return useConvexQuery(apiMethod, args === "skip" ? "skip" : { ...args, sessionId: token ?? undefined });
}

export function useMutation(apiMethod: any) {
  const { token } = useAuth();
  const mutation = useConvexMutation(apiMethod);
  return (args: any = {}) => mutation({ ...args, sessionId: token ?? undefined });
}
