import { authQuery, authMutation } from "./customAuth";
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "./authHelper";

// ─── Generate Daily/Weekly/Monthly Challenges ─────────────────────────────

export const generateChallenges = internalMutation({
  args: {
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(dayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);

    let startsAt: number;
    let endsAt: number;

    switch (args.type) {
      case "daily":
        startsAt = dayStart.getTime();
        endsAt = dayStart.getTime() + 24 * 60 * 60 * 1000;
        break;
      case "weekly":
        startsAt = weekStart.getTime();
        endsAt = weekStart.getTime() + 7 * 24 * 60 * 60 * 1000;
        break;
      case "monthly":
        startsAt = monthStart.getTime();
        const nextMonth = new Date(dayStart.getFullYear(), dayStart.getMonth() + 1, 1);
        endsAt = nextMonth.getTime();
        break;
    }

    // Deactivate existing challenges of this type
    const existing = await ctx.db.query("challenges")
      .withIndex("type", (q: any) => q.eq("type", args.type))
      .collect();

    for (const c of existing) {
      await ctx.db.patch(c._id, { active: false });
    }

    // Templates per type
    const dailyTemplates = [
      { title: "Test Drive Trio", description: "Complete 3 test drives today", target: 3, progressField: "test_drives" as const, rewardXP: 100 },
      { title: "Finance Finisher", description: "Complete 2 finance approvals", target: 2, progressField: "finance_approvals" as const, rewardXP: 150 },
      { title: "Document Champion", description: "Upload all pending documents", target: 5, progressField: "document_upload" as const, rewardXP: 80 },
      { title: "One Delivery", description: "Deliver one vehicle today", target: 1, progressField: "deliveries" as const, rewardXP: 200 },
      { title: "Booking Star", description: "Create 3 new bookings", target: 3, progressField: "bookings" as const, rewardXP: 120 },
      { title: "Insurance Plus", description: "Sell 2 insurance policies", target: 2, progressField: "insurance_sales" as const, rewardXP: 100 },
    ];

    const weeklyTemplates = [
      { title: "SUV Sprint", description: "Sell 5 SUVs this week", target: 5, progressField: "suv_sales" as const, rewardXP: 500 },
      { title: "Delivery Drive", description: "Complete 10 deliveries", target: 10, progressField: "deliveries" as const, rewardXP: 750 },
      { title: "Lead Closer", description: "Close 20 leads", target: 20, progressField: "leads_closed" as const, rewardXP: 600 },
      { title: "XP Hunter", description: "Earn 2000 XP this week", target: 2000, progressField: "xp_earned" as const, rewardXP: 1000 },
    ];

    const monthlyTemplates = [
      { title: "Top Performer", description: "Become the top performer this month", target: 1, progressField: "xp_earned" as const, rewardXP: 2000, rewardBadge: "monthly_winner" },
      { title: "Target Complete", description: "Complete your monthly target", target: 30, progressField: "deliveries" as const, rewardXP: 1500 },
      { title: "Zero Pending", description: "Zero pending documents all month", target: 0, progressField: "document_upload" as const, rewardXP: 1000 },
    ];

    const templates = args.type === "daily" ? dailyTemplates
      : args.type === "weekly" ? weeklyTemplates
      : monthlyTemplates;

    // Pick 3 random templates for daily, 2 for weekly, 1 for monthly
    const count = args.type === "daily" ? 3 : args.type === "weekly" ? 2 : 1;
    const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, count);

    for (const template of shuffled) {
      await ctx.db.insert("challenges", {
        type: args.type,
        title: template.title,
        description: template.description,
        target: template.target,
        progressField: template.progressField,
        rewardXP: template.rewardXP,
        rewardBadge: (template as any).rewardBadge,
        active: true,
        startsAt,
        endsAt,
      });
    }
  },
});

// ─── Update Challenge Progress ─────────────────────────────────────────────

export const updateChallengeProgress = internalMutation({
  args: {
    employeeId: v.id("users"),
    field: v.union(
      v.literal("test_drives"),
      v.literal("finance_approvals"),
      v.literal("deliveries"),
      v.literal("bookings"),
      v.literal("insurance_sales"),
      v.literal("document_upload"),
      v.literal("leads_closed"),
      v.literal("suv_sales"),
      v.literal("xp_earned"),
    ),
    increment: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const activeChallenges = await ctx.db.query("challenges")
      .withIndex("active", (q: any) => q.eq("active", true))
      .filter((q: any) =>
        q.and(
          q.lte(q.field("startsAt"), now),
          q.gte(q.field("endsAt"), now),
        )
      )
      .collect();

    const relevantChallenges = activeChallenges.filter(
      (c) => c.progressField === args.field
    );

    for (const challenge of relevantChallenges) {
      const existing = await ctx.db.query("challengeProgress")
        .withIndex("employeeId_challengeId", (q: any) =>
          q.eq("employeeId", args.employeeId).eq("challengeId", challenge._id)
        )
        .first();

      if (existing) {
        const newProgress = existing.progress + args.increment;
        const completed = !existing.completed && newProgress >= challenge.target;

        await ctx.db.patch(existing._id, {
          progress: newProgress,
          completed,
          completedAt: completed ? now : undefined,
        });

        if (completed) {
          // Award XP
          const user = await ctx.db.get(args.employeeId);
          if (user) {
            const newXP = (user.totalXP ?? 0) + challenge.rewardXP;
            const { getLevelProgress } = await import("./schema");
            const newLevelInfo = getLevelProgress(newXP);

            await ctx.db.patch(args.employeeId, {
              totalXP: newXP,
              level: newLevelInfo.level,
              rank: newLevelInfo.title,
            });

            // Notification
            await ctx.db.insert("notifications", {
              employeeId: args.employeeId,
              type: "challenge_completed",
              title: `Challenge Complete: ${challenge.title}!`,
              message: `You earned ${challenge.rewardXP} XP for completing "${challenge.title}"`,
              read: false,
              metadata: { challengeId: challenge._id, rewardXP: challenge.rewardXP },
              createdAt: now,
            });

            // Activity
            await ctx.db.insert("activities", {
              employeeId: args.employeeId,
              type: "achievement",
              message: `${user.name ?? "Someone"} completed "${challenge.title}"! 🎯`,
              likes: [],
              comments: [],
              createdAt: now,
            });
          }
        }
      } else {
        const progress = Math.min(args.increment, challenge.target);
        await ctx.db.insert("challengeProgress", {
          employeeId: args.employeeId,
          challengeId: challenge._id,
          progress,
          completed: progress >= challenge.target,
          completedAt: progress >= challenge.target ? now : undefined,
        });
      }
    }
  },
});

// ─── Get Active Challenges ─────────────────────────────────────────────────

export const getActiveChallenges = authQuery({
  args: {
    type: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    let challenges;
    if (args.type) {
      challenges = await ctx.db.query("challenges")
        .withIndex("type", (q: any) => q.eq("type", args.type))
        .filter((q: any) =>
          q.and(
            q.eq(q.field("active"), true),
            q.lte(q.field("startsAt"), now),
            q.gte(q.field("endsAt"), now),
          )
        )
        .collect();
    } else {
      challenges = await ctx.db.query("challenges")
        .withIndex("active", (q: any) => q.eq("active", true))
        .filter((q: any) =>
          q.and(
            q.lte(q.field("startsAt"), now),
            q.gte(q.field("endsAt"), now),
          )
        )
        .collect();
    }

    // Only get user progress if authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) return challenges.map(c => ({ challenge: c, progress: null }));

    const results = await Promise.all(
      challenges.map(async (challenge) => {
        const progress = await ctx.db.query("challengeProgress")
          .withIndex("employeeId_challengeId", (q: any) =>
            q.eq("employeeId", userId).eq("challengeId", challenge._id)
          )
          .first();
        return { challenge, progress };
      })
    );

    return results;
  },
});

// ─── Get Employee Challenge History ────────────────────────────────────────

export const getEmployeeChallengeHistory = authQuery({
  args: {
    employeeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const targetId = args.employeeId ?? userId;

    const progressEntries = await ctx.db.query("challengeProgress")
      .withIndex("employeeId", (q: any) => q.eq("employeeId", targetId))
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      progressEntries.map(async (entry) => {
        const challenge = await ctx.db.get(entry.challengeId);
        return { ...entry, challenge };
      })
    );

    return enriched;
  },
});
