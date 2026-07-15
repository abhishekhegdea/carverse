import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// 1. Mutation to create the request in DB
export const submitExchangeRequest = mutation({
  args: {
    customerName: v.string(),
    phone: v.string(),
    brand: v.string(),
    model: v.string(),
    year: v.number(),
    kilometers: v.number(),
    images: v.array(v.string()), // Simulated Cloudinary URLs
  },
  handler: async (ctx, args) => {
    // Check if customer exists or create them
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("phone", (q) => q.eq("phone", args.phone))
      .first();

    let customerId = existingCustomer?._id;
    if (!customerId) {
      customerId = await ctx.db.insert("customers", {
        name: args.customerName,
        phone: args.phone,
        createdAt: Date.now(),
      });
    }

    // Insert exchange request
    const exchangeId = await ctx.db.insert("exchangeRequests", {
      customerId,
      customerName: args.customerName,
      phone: args.phone,
      brand: args.brand,
      model: args.model,
      year: args.year,
      kilometers: args.kilometers,
      status: "pending",
      images: args.images,
      createdAt: Date.now(),
    });

    return exchangeId;
  },
});

// 2. Action to call your Real Python ML Server
export const evaluateExchangeML = action({
  args: {
    exchangeId: v.id("exchangeRequests"),
    brand: v.string(),
    year: v.number(),
    kilometers: v.number(),
  },
  handler: async (ctx, args) => {

    // =========================================================================
    // 🔌 ML INTEGRATION INSTRUCTIONS
    // =========================================================================
    // 1. Run your Python ML server locally (e.g., on port 8000)
    // 2. Expose it to the internet using Ngrok: `ngrok http 8000`
    // 3. Paste the generated Ngrok URL below (replace 'https://YOUR_NGROK_URL.ngrok-free.app')

    const ML_SERVER_URL = "https://provable-underuse-haiku.ngrok-free.dev";

    let estimatedValue = 0;
    let conditionScore = 0;

    try {
      // 🚀 Make the request to your Python server!
      const response = await fetch(ML_SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: args.brand,
          year: args.year,
          kilometers: args.kilometers,
        }),
      });

      if (!response.ok) {
        throw new Error(`ML Server returned ${response.status}`);
      }

      const mlResult = await response.json();

      // We expect your Python server to return JSON like:
      // { "estimatedValue": 850000, "conditionScore": 88 }
      estimatedValue = mlResult.estimatedValue;
      conditionScore = mlResult.conditionScore;

    } catch (error) {
      console.warn("ML Server not reachable or failed. Using fallback mock data.", error);

      // Fallback logic if your server is offline
      const baseValue = 1000000;
      estimatedValue = Math.max(50000, Math.round(baseValue - ((new Date().getFullYear() - args.year) * 0.1 * baseValue) - ((args.kilometers / 10000) * 0.05 * baseValue)));
      conditionScore = Math.floor(Math.random() * (95 - 65 + 1)) + 65;
      estimatedValue = estimatedValue * (conditionScore / 100);
    }

    // Update the DB with the results
    await ctx.runMutation(api.exchange.updateExchangeEvaluation, {
      exchangeId: args.exchangeId,
      estimatedValue,
      conditionScore,
    });

    return { estimatedValue, conditionScore };
  },
});

export const updateExchangeEvaluation = mutation({
  args: {
    exchangeId: v.id("exchangeRequests"),
    estimatedValue: v.number(),
    conditionScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.exchangeId, {
      status: "evaluated",
      estimatedValue: args.estimatedValue,
      conditionScore: args.conditionScore,
    });
  },
});
