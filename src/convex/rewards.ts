import { authQuery, authMutation } from "./customAuth";
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "./authHelper";
import { getLevelProgress } from "./schema";

// ─── Reward Items ──────────────────────────────────────────────────────────

const DEFAULT_REWARDS = [
  { name: "Amazon Voucher ₹500", description: "Amazon gift voucher worth ₹500", xpCost: 5000, category: "voucher", stock: 100, active: true },
  { name: "Amazon Voucher ₹1000", description: "Amazon gift voucher worth ₹1000", xpCost: 9000, category: "voucher", stock: 50, active: true },
  { name: "Fuel Card ₹500", description: "Fuel card worth ₹500", xpCost: 4500, category: "fuel", stock: 75, active: true },
  { name: "Fuel Card ₹1000", description: "Fuel card worth ₹1000", xpCost: 8500, category: "fuel", stock: 40, active: true },
  { name: "Movie Tickets (Pair)", description: "Two movie tickets for any cinema", xpCost: 3000, category: "entertainment", stock: 60, active: true },
  { name: "Extra Leave Day", description: "One extra paid leave day", xpCost: 7000, category: "leave", stock: 20, active: true },
  { name: "Lunch Coupon", description: "Complimentary lunch coupon", xpCost: 1500, category: "food", stock: 100, active: true },
  { name: "Car Accessories Kit", description: "Premium car accessories kit", xpCost: 12000, category: "accessories", stock: 15, active: true },
  { name: "Training Course Pass", description: "Online professional training course", xpCost: 8000, category: "training", stock: 25, active: true },
];

// ─── Initialize Rewards ────────────────────────────────────────────────────

export const initializeRewards = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("rewards").collect();
    if (existing.length > 0) return;

    for (const reward of DEFAULT_REWARDS) {
      await ctx.db.insert("rewards", reward);
    }
  },
});

// ─── Get Available Rewards ─────────────────────────────────────────────────

export const getRewards = authQuery({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { rewards: [], userXP: 0 };

    const user = await ctx.db.get(userId);
    const userXP = user?.totalXP ?? 0;

    let rewards;
    if (args.category) {
      rewards = await ctx.db.query("rewards")
        .filter((q: any) =>
          q.and(
            q.eq(q.field("active"), true),
            q.eq(q.field("category"), args.category),
            q.gt(q.field("stock"), 0),
          )
        )
        .collect();
    } else {
      rewards = await ctx.db.query("rewards")
        .filter((q: any) =>
          q.and(
            q.eq(q.field("active"), true),
            q.gt(q.field("stock"), 0),
          )
        )
        .collect();
    }

    return { rewards, userXP };
  },
});

// ─── Redeem Reward ─────────────────────────────────────────────────────────

export const redeemReward = authMutation({
  args: {
    rewardId: v.id("rewards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const reward = await ctx.db.get(args.rewardId);
    if (!reward || !reward.active || reward.stock <= 0) {
      throw new Error("Reward not available");
    }

    const userXP = user.totalXP ?? 0;
    if (userXP < reward.xpCost) {
      throw new Error("Insufficient XP");
    }

    // Deduct XP
    const newXP = userXP - reward.xpCost;
    const newLevelInfo = getLevelProgress(newXP);

    await ctx.db.patch(userId, {
      totalXP: newXP,
      level: newLevelInfo.level,
      rank: newLevelInfo.title,
    });

    // Reduce stock
    await ctx.db.patch(args.rewardId, {
      stock: reward.stock - 1,
    });

    // Record redemption
    const redemptionId = await ctx.db.insert("rewardRedemptions", {
      employeeId: userId,
      rewardId: args.rewardId,
      xpSpent: reward.xpCost,
      status: "pending",
      redeemedAt: Date.now(),
    });

    // Notification
    await ctx.db.insert("notifications", {
      employeeId: userId,
      type: "reward_ready",
      title: `Reward Redeemed: ${reward.name}`,
      message: `You spent ${reward.xpCost} XP on ${reward.name}. It will be processed soon.`,
      read: false,
      metadata: { rewardId: args.rewardId, redemptionId, xpSpent: reward.xpCost },
      createdAt: Date.now(),
    });

    return { redemptionId, xpSpent: reward.xpCost, remainingXP: newXP };
  },
});

// ─── Get Redemption History ────────────────────────────────────────────────

export const getMyRedemptions = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const redemptions = await ctx.db.query("rewardRedemptions")
      .withIndex("employeeId", (q: any) => q.eq("employeeId", userId))
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      redemptions.map(async (r) => {
        const reward = await ctx.db.get(r.rewardId);
        return { ...r, reward };
      })
    );

    return enriched;
  },
});

// ─── Approve Redemption (Admin) ────────────────────────────────────────────

export const approveRedemption = authMutation({
  args: {
    redemptionId: v.id("rewardRedemptions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "super_admin") throw new Error("Not authorized");

    await ctx.db.patch(args.redemptionId, {
      status: "approved",
      approvedBy: userId,
    });
  },
});

// ─── Spin Wheel Rewards ────────────────────────────────────────────────────

const SPIN_REWARDS = [
  { label: "Double XP", type: "multiplier", multiplier: 2, weight: 15 },
  { label: "50 XP Bonus", type: "xp_bonus", xpAmount: 50, weight: 25 },
  { label: "100 XP Bonus", type: "xp_bonus", xpAmount: 100, weight: 20 },
  { label: "Lucky Badge", type: "badge", badgeId: "first_booking", weight: 5 },
  { label: "Extra Leave Day", type: "coupon", weight: 10 },
  { label: "Fuel Voucher", type: "coupon", weight: 10 },
  { label: "Lunch Coupon", type: "coupon", weight: 10 },
  { label: "No Luck", type: "none", weight: 5 },
];

function spinWheel() {
  const totalWeight = SPIN_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of SPIN_REWARDS) {
    random -= reward.weight;
    if (random <= 0) return reward;
  }

  return SPIN_REWARDS[SPIN_REWARDS.length - 1];
}

// ─── Perform Spin ──────────────────────────────────────────────────────────

export const performSpin = authMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const SPIN_COST = 1000;
    const userXP = user.totalXP ?? 0;
    if (userXP < SPIN_COST) {
      throw new Error(`Need ${SPIN_COST} XP to spin. You have ${userXP} XP.`);
    }

    // Deduct XP
    const newXP = userXP - SPIN_COST;
    const newLevelInfo = getLevelProgress(newXP);

    await ctx.db.patch(userId, {
      totalXP: newXP,
      level: newLevelInfo.level,
      rank: newLevelInfo.title,
    });

    // Spin
    const result = spinWheel();

    // Apply reward
    let rewardDescription = result.label;
    switch (result.type) {
      case "xp_bonus": {
        const bonusXP = newXP + (result.xpAmount ?? 0);
        const bonusLevelInfo = getLevelProgress(bonusXP);
        await ctx.db.patch(userId, {
          totalXP: bonusXP,
          level: bonusLevelInfo.level,
          rank: bonusLevelInfo.title,
        });
        rewardDescription = `${result.label} (+${result.xpAmount} XP)`;
        break;
      }
      case "multiplier": {
        // Store multiplier in user metadata for next XP event
        rewardDescription = `${result.label} (${result.multiplier}x next earning)`;
        break;
      }
      case "badge": {
        const badgeList = user.badgeIds ?? [];
        if (!badgeList.includes(result.badgeId ?? "")) {
          await ctx.db.patch(userId, {
            badgeIds: [...badgeList, result.badgeId ?? ""],
          });

          const badges = await ctx.db.query("badges")
            .withIndex("badgeId", (q: any) => q.eq("badgeId", result.badgeId ?? ""))
            .first();

          await ctx.db.insert("badges", {
            employeeId: userId,
            badgeId: result.badgeId ?? "",
            label: "Lucky Badge",
            earnedAt: Date.now(),
          });
        }
        break;
      }
    }

    // Record spin
    await ctx.db.insert("spinWheelSpins", {
      employeeId: userId,
      xpCost: SPIN_COST,
      reward: result.label,
      rewardType: result.type,
      multiplier: result.multiplier,
      spunAt: Date.now(),
    });

    // Notification
    if (result.type !== "none") {
      await ctx.db.insert("notifications", {
        employeeId: userId,
        type: "reward_ready",
        title: `Spin Win: ${result.label}!`,
        message: `You won "${result.label}" from the Spin Wheel!`,
        read: false,
        metadata: { spinReward: result.label, spinType: result.type },
        createdAt: Date.now(),
      });
    }

    return {
      reward: result.label,
      type: result.type,
      multiplier: result.multiplier,
      xpAmount: result.xpAmount,
      xpSpent: SPIN_COST,
      remainingXP: newXP,
    };
  },
});

// ─── Get Spin History ──────────────────────────────────────────────────────

export const getSpinHistory = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const spins = await ctx.db.query("spinWheelSpins")
      .withIndex("employeeId", (q: any) => q.eq("employeeId", userId))
      .order("desc")
      .take(20);

    return spins;
  },
});

// ─── Admin: Create Reward ──────────────────────────────────────────────────

export const createReward = authMutation({
  args: {
    name: v.string(),
    description: v.string(),
    xpCost: v.number(),
    category: v.string(),
    stock: v.number(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "super_admin") throw new Error("Not authorized");

    await ctx.db.insert("rewards", {
      name: args.name,
      description: args.description,
      xpCost: args.xpCost,
      category: args.category,
      stock: args.stock,
      image: args.image,
      active: true,
    });
  },
});
