import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// ─── Generate Session Token ──────────────────────────────────────────────
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ─── Hash Password ────────────────────────────────────────────────────────
// Using a simple hash for demonstration. In production, use a proper key derivation function.
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "carverse_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Register ──────────────────────────────────────────────────────────────
export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.optional(v.string()), // Allow passing role (e.g. from a select)
  },
  handler: async (ctx, args) => {
    // Check if email exists
    const normalizedEmail = args.email.toLowerCase().trim();
    const existing = await ctx.db.query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();
    
    let userId = existing?._id;

    if (existing) {
      // Check if they already have a password
      const passwordRecord = await ctx.db.query("passwords")
        .withIndex("userId", (q) => q.eq("userId", existing._id))
        .first();

      if (passwordRecord) {
        throw new Error("Email already registered");
      }
      
      // If no password record exists, they are a seeded user. We will initialize their password!
    } else {
      // Create a brand new user
      userId = await ctx.db.insert("users", {
        name: args.name,
        email: normalizedEmail,
        role: (args.role as any) ?? "sales_executive",
        totalXP: 0,
        level: 1,
        rank: "Rookie",
        createdAt: Date.now(),
      });
    }

    // Hash and store password
    const hash = await hashPassword(args.password);
    await ctx.db.insert("passwords", {
      userId: userId!,
      hash,
    });

    // Generate session
    const token = generateToken();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    await ctx.db.insert("authSessions", {
      userId: userId!,
      token,
      expiresAt,
    });

    return { token, userId: userId! };
  },
});

// ─── Login ─────────────────────────────────────────────────────────────────
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();
    const user = await ctx.db.query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordRecord = await ctx.db.query("passwords")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    if (!passwordRecord) {
      throw new Error("Invalid email or password");
    }

    const hash = await hashPassword(args.password);
    if (hash !== passwordRecord.hash) {
      throw new Error("Invalid email or password");
    }

    // Generate session
    const token = generateToken();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    await ctx.db.insert("authSessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    return { token, userId: user._id, role: user.role };
  },
});

// ─── Logout ────────────────────────────────────────────────────────────────
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.query("authSessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// ─── Validate Session ──────────────────────────────────────────────────────
export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.query("authSessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    return user;
  },
});
