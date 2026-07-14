import { query as originalQuery, mutation as originalMutation } from "./_generated/server";
import { v } from "convex/values";

export const authQuery = (config: any) => {
  return originalQuery({
    args: { ...config.args, sessionId: v.optional(v.string()) },
    handler: async (ctx: any, args: any) => {
      let userId = null;
      if (args.sessionId) {
        const session = await ctx.db.query("authSessions")
          .withIndex("token", (q: any) => q.eq("token", args.sessionId))
          .first();
        if (session && session.expiresAt > Date.now()) {
          userId = session.userId;
        }
      }
      return config.handler({ ...ctx, userId }, args);
    }
  });
};

export const authMutation = (config: any) => {
  return originalMutation({
    args: { ...config.args, sessionId: v.optional(v.string()) },
    handler: async (ctx: any, args: any) => {
      let userId = null;
      if (args.sessionId) {
        const session = await ctx.db.query("authSessions")
          .withIndex("token", (q: any) => q.eq("token", args.sessionId))
          .first();
        if (session && session.expiresAt > Date.now()) {
          userId = session.userId;
        }
      }
      return config.handler({ ...ctx, userId }, args);
    }
  });
};
