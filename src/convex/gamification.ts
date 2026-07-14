import { authQuery, authMutation } from "./customAuth";
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "./authHelper";
import { XP_EVENTS, getLevel, getLevelProgress, BADGES, type XPEventType } from "./schema";
import { Doc, Id } from "./_generated/dataModel";

// ─── Award XP ──────────────────────────────────────────────────────────────

export const awardXP = internalMutation({
  args: {
    employeeId: v.id("users"),
    eventType: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const xpConfig = XP_EVENTS[args.eventType as XPEventType];
    if (!xpConfig) return { xpAwarded: 0, newLevel: 0 };

    const xpAmount = xpConfig.xp;
    const user = await ctx.db.get(args.employeeId);
    if (!user) return { xpAwarded: 0, newLevel: 0 };

    const currentXP = user.totalXP ?? 0;
    const newXP = Math.max(0, currentXP + xpAmount);
    const newLevelInfo = getLevelProgress(newXP);
    const oldLevelInfo = getLevelProgress(currentXP);

    // Update user XP
    await ctx.db.patch(args.employeeId, {
      totalXP: newXP,
      level: newLevelInfo.level,
      rank: newLevelInfo.title,
    });

    // Record XP transaction
    await ctx.db.insert("xpTransactions", {
      employeeId: args.employeeId,
      amount: xpAmount,
      eventType: args.eventType,
      description: args.description ?? xpConfig.label,
      balance: newXP,
      timestamp: Date.now(),
    });

    // Record event
    await ctx.db.insert("events", {
      employeeId: args.employeeId,
      eventType: args.eventType,
      description: args.description ?? xpConfig.label,
      xpAwarded: xpAmount,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    // Check level up
    const leveledUp = newLevelInfo.level > oldLevelInfo.level;

    // Distribute hierarchy rewards for positive XP events
    if (xpAmount > 0 && user.managerId) {
      await distributeHierarchyXP(ctx, args.employeeId, user.managerId, args.eventType, xpAmount, 1);
    }

    // Check badge eligibility
    if (xpAmount > 0) {
      await checkBadges(ctx, args.employeeId, args.eventType);
    }

    // Create notification
    const notificationTitle = xpAmount >= 0
      ? `+${xpAmount} XP`
      : `${xpAmount} XP`;
    const notificationMessage = xpAmount >= 0
      ? `Earned ${xpAmount} XP for ${xpConfig.label}`
      : `Lost ${Math.abs(xpAmount)} XP for ${xpConfig.label}`;

    await ctx.db.insert("notifications", {
      employeeId: args.employeeId,
      type: xpAmount >= 0 ? "xp_earned" : "system",
      title: notificationTitle,
      message: notificationMessage,
      read: false,
      metadata: { eventType: args.eventType, xpAmount, newBalance: newXP },
      createdAt: Date.now(),
    });

    // Post activity for significant events
    if (xpAmount >= 100) {
      await ctx.db.insert("activities", {
        employeeId: args.employeeId,
        type: "xp_milestone",
        message: `${user.name ?? "Someone"} earned ${xpAmount} XP — ${xpConfig.label}`,
        likes: [],
        comments: [],
        createdAt: Date.now(),
      });
    }

    if (leveledUp) {
      await ctx.db.insert("notifications", {
        employeeId: args.employeeId,
        type: "level_up",
        title: `Level ${newLevelInfo.level} — ${newLevelInfo.title}!`,
        message: `Congratulations! You've reached Level ${newLevelInfo.level}: ${newLevelInfo.title}`,
        read: false,
        metadata: { oldLevel: oldLevelInfo.level, newLevel: newLevelInfo.level, newTitle: newLevelInfo.title },
        createdAt: Date.now(),
      });

      await ctx.db.insert("activities", {
        employeeId: args.employeeId,
        type: "level_up",
        message: `${user.name ?? "Someone"} reached Level ${newLevelInfo.level}: ${newLevelInfo.title}! 🎉`,
        likes: [],
        comments: [],
        createdAt: Date.now(),
      });
    }

    return { xpAwarded: xpAmount, newLevel: newLevelInfo.level, leveledUp };
  },
});

// ─── Distribute Hierarchy XP ───────────────────────────────────────────────

async function distributeHierarchyXP(
  ctx: any,
  sourceEmployeeId: Id<"users">,
  managerId: Id<"users">,
  eventType: string,
  sourceXP: number,
  depth: number,
) {
  const hierarchyPercentages = [0.30, 0.20, 0.10, 0.05]; // TL:30%, Mgr:20%, RM:10%, RD:5%
  
  if (depth > hierarchyPercentages.length) return;
  
  const manager = await ctx.db.get(managerId);
  if (!manager) return;

  const hierarchyXP = Math.round(sourceXP * hierarchyPercentages[depth - 1]);
  if (hierarchyXP <= 0) return;

  const currentXP = manager.totalXP ?? 0;
  const newXP = currentXP + hierarchyXP;
  const newLevelInfo = getLevelProgress(newXP);

  await ctx.db.patch(managerId, {
    totalXP: newXP,
    level: newLevelInfo.level,
    rank: newLevelInfo.title,
  });

  await ctx.db.insert("xpTransactions", {
    employeeId: managerId,
    amount: hierarchyXP,
    eventType: "hierarchy_reward",
    description: `Hierarchy reward (${depth} level up) from team sale`,
    balance: newXP,
    timestamp: Date.now(),
  });

  await ctx.db.insert("hierarchyRewards", {
    sourceEmployeeId,
    targetEmployeeId: managerId,
    eventType,
    sourceXP,
    hierarchyXP,
    hierarchyLevel: depth,
    timestamp: Date.now(),
  });

  await ctx.db.insert("notifications", {
    employeeId: managerId,
    type: "xp_earned",
    title: `+${hierarchyXP} XP (Team Reward)`,
    message: `You earned ${hierarchyXP} XP from your team's achievement`,
    read: false,
    metadata: { eventType: "hierarchy_reward", xpAmount: hierarchyXP, sourceEmployeeId },
    createdAt: Date.now(),
  });

  // Recursively distribute up the chain
  if (manager.managerId) {
    await distributeHierarchyXP(ctx, sourceEmployeeId, manager.managerId, eventType, sourceXP, depth + 1);
  }
}

// ─── Check Badge Eligibility ───────────────────────────────────────────────

async function checkBadges(ctx: any, employeeId: Id<"users">, eventType: string) {
  const user = await ctx.db.get(employeeId);
  if (!user) return;

  const earnedBadges = user.badgeIds ?? [];

  // Count various stats
  const deliveries = await ctx.db.query("sales")
    .withIndex("employeeId", (q: any) => q.eq("employeeId", employeeId))
    .filter((q: any) => q.eq(q.field("status"), "delivered"))
    .collect();

  const bookingCount = deliveries.length;

  const financeApprovals = await ctx.db.query("events")
    .withIndex("employeeId_eventType", (q: any) => q.eq("employeeId", employeeId).eq("eventType", "finance_approved"))
    .collect();

  const financeCount = financeApprovals.length;

  const insuranceSales = await ctx.db.query("sales")
    .withIndex("employeeId", (q: any) => q.eq("employeeId", employeeId))
    .filter((q: any) => q.eq(q.field("hasInsurance"), true))
    .collect();

  const insuranceCount = insuranceSales.length;

  const suvSales = deliveries.filter((s: any) => s.carType === "suv").length;
  const luxurySales = deliveries.filter((s: any) => s.carType === "luxury").length;
  const evSales = deliveries.filter((s: any) => s.carType === "electric").length;

  const fiveStarFeedbacks = await ctx.db.query("events")
    .withIndex("employeeId_eventType", (q: any) => q.eq("employeeId", employeeId).eq("eventType", "customer_feedback_5_star"))
    .collect();

  const feedbackCount = fiveStarFeedbacks.length;

  // Define badge conditions
  const badgeConditions: Record<string, () => boolean> = {
    first_booking: () => bookingCount >= 1 && !earnedBadges.includes("first_booking"),
    first_sale: () => deliveries.length >= 1 && !earnedBadges.includes("first_sale"),
    five_deliveries: () => bookingCount >= 5 && !earnedBadges.includes("five_deliveries"),
    ten_deliveries: () => bookingCount >= 10 && !earnedBadges.includes("ten_deliveries"),
    fifty_deliveries: () => bookingCount >= 50 && !earnedBadges.includes("fifty_deliveries"),
    hundred_deliveries: () => bookingCount >= 100 && !earnedBadges.includes("hundred_deliveries"),
    finance_expert: () => financeCount >= 20 && !earnedBadges.includes("finance_expert"),
    insurance_king: () => insuranceCount >= 30 && !earnedBadges.includes("insurance_king"),
    suv_specialist: () => suvSales >= 15 && !earnedBadges.includes("suv_specialist"),
    luxury_specialist: () => luxurySales >= 10 && !earnedBadges.includes("luxury_specialist"),
    ev_specialist: () => evSales >= 10 && !earnedBadges.includes("ev_specialist"),
    customer_hero: () => feedbackCount >= 10 && !earnedBadges.includes("customer_hero"),
  };

  for (const [badgeId, condition] of Object.entries(badgeConditions)) {
    if (condition()) {
      const badgeInfo = BADGES.find((b: any) => b.id === badgeId);
      if (!badgeInfo) continue;

      await ctx.db.insert("badges", {
        employeeId,
        badgeId,
        label: badgeInfo.label,
        earnedAt: Date.now(),
      });

      await ctx.db.patch(employeeId, {
        badgeIds: [...earnedBadges, badgeId],
      });

      // Notification
      await ctx.db.insert("notifications", {
        employeeId,
        type: "badge_unlocked",
        title: `Badge Unlocked: ${badgeInfo.label}!`,
        message: badgeInfo.description,
        read: false,
        metadata: { badgeId, badgeLabel: badgeInfo.label },
        createdAt: Date.now(),
      });

      // Activity
      await ctx.db.insert("activities", {
        employeeId,
        type: "badge_earned",
        message: `${user.name ?? "Someone"} earned the "${badgeInfo.label}" badge! 🏆`,
        likes: [],
        comments: [],
        createdAt: Date.now(),
      });
    }
  }
}

// ─── Query User Progress ───────────────────────────────────────────────────

export const getUserProgress = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const levelProgress = getLevelProgress(user.totalXP ?? 0);
    const badges = await ctx.db.query("badges")
      .withIndex("employeeId", (q: any) => q.eq("employeeId", userId))
      .order("desc")
      .take(20);

    const recentXP = await ctx.db.query("xpTransactions")
      .withIndex("employeeId_timestamp", (q: any) => q.eq("employeeId", userId))
      .order("desc")
      .take(10);

    const activeChallenges = await ctx.db.query("challenges")
      .filter((q: any) => q.eq(q.field("active"), true))
      .collect();

    // Get challenge progress for user
    const challengeProgress = await Promise.all(
      activeChallenges.map(async (challenge) => {
        const progress = await ctx.db.query("challengeProgress")
          .withIndex("employeeId_challengeId", (q: any) =>
            q.eq("employeeId", userId).eq("challengeId", challenge._id)
          )
          .first();
        return { challenge, progress };
      })
    );

    const recentNotifications = await ctx.db.query("notifications")
      .withIndex("employeeId", (q: any) => q.eq("employeeId", userId))
      .order("desc")
      .take(5);

    const unreadCount = await ctx.db.query("notifications")
      .withIndex("employeeId_read", (q: any) => q.eq("employeeId", userId).eq("read", false))
      .collect()
      .then((r: any[]) => r.length);

    // Leaderboard ranking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailyRank = await ctx.db.query("leaderboard")
      .withIndex("periodType_scope", (q: any) => q.eq("periodType", "daily").eq("scope", "individual"))
      .filter((q: any) => q.eq(q.field("employeeId"), userId))
      .filter((q: any) => q.gte(q.field("periodStart"), today.getTime()))
      .first();

    const weeklyRank = await ctx.db.query("leaderboard")
      .withIndex("periodType_scope", (q: any) => q.eq("periodType", "weekly").eq("scope", "individual"))
      .filter((q: any) => q.eq(q.field("employeeId"), userId))
      .filter((q: any) => q.gte(q.field("periodStart"), weekStart.getTime()))
      .first();

    const monthlyRank = await ctx.db.query("leaderboard")
      .withIndex("periodType_scope", (q: any) => q.eq("periodType", "monthly").eq("scope", "individual"))
      .filter((q: any) => q.eq(q.field("employeeId"), userId))
      .filter((q: any) => q.gte(q.field("periodStart"), monthStart.getTime()))
      .first();

    return {
      user,
      levelProgress,
      badges,
      recentXP,
      challengeProgress,
      recentNotifications,
      unreadCount,
      dailyRank: dailyRank?.rank ?? null,
      weeklyRank: weeklyRank?.rank ?? null,
      monthlyRank: monthlyRank?.rank ?? null,
    };
  },
});

// ─── Get Leaderboard ───────────────────────────────────────────────────────

export const getLeaderboard = authQuery({
  args: {
    periodType: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    scope: v.union(v.literal("individual"), v.literal("branch"), v.literal("dealer"), v.literal("region"), v.literal("state"), v.literal("country"), v.literal("department")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let periodStart: number;

    switch (args.periodType) {
      case "daily":
        periodStart = today.getTime();
        break;
      case "weekly":
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        periodStart = weekStart.getTime();
        break;
      case "monthly":
        periodStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
        break;
      case "quarterly":
        const quarter = Math.floor(today.getMonth() / 3);
        periodStart = new Date(today.getFullYear(), quarter * 3, 1).getTime();
        break;
      case "yearly":
        periodStart = new Date(today.getFullYear(), 0, 1).getTime();
        break;
    }

    const entries = await ctx.db.query("leaderboard")
      .withIndex("periodType_scope", (q: any) => q.eq("periodType", args.periodType).eq("scope", args.scope))
      .filter((q: any) => q.gte(q.field("periodStart"), periodStart))
      .order("asc")
      .take(args.limit ?? 50);

    // Enrich with user details
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        if (entry.employeeId) {
          const emp = await ctx.db.get(entry.employeeId);
          return { ...entry, employee: emp };
        }
        return { ...entry };
      })
    );

    return enriched;
  },
});

// ─── Get All Users (Admin) ────────────────────────────────────────────────

export const getAllUsers = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "super_admin" && user.role !== "regional_director" && user.role !== "dealer_principal")) return [];
    
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

// ─── Update User Role ─────────────────────────────────────────────────────

export const updateUserRole = authMutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("super_admin"),
      v.literal("regional_director"),
      v.literal("regional_manager"),
      v.literal("dealer_principal"),
      v.literal("branch_manager"),
      v.literal("sales_manager"),
      v.literal("team_leader"),
      v.literal("sales_executive"),
      v.literal("finance_executive"),
      v.literal("insurance_executive"),
      v.literal("service_advisor"),
      v.literal("customer"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Not authorized");
    
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// ─── Update User Manager ──────────────────────────────────────────────────

export const updateUserManager = authMutation({
  args: {
    userId: v.id("users"),
    managerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Not authorized");
    
    await ctx.db.patch(args.userId, { managerId: args.managerId });
  },
});
