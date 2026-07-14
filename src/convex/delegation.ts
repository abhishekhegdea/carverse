import { authQuery, authMutation } from "./customAuth";
import { v } from "convex/values";
import { getAuthUserId } from "./authHelper";
import { getLevelProgress } from "./schema";

// ─── Get Reportees ─────────────────────────────────────────────────────────

export const getReportees = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    if (user.role === "super_admin") {
      // Super admin can see everyone except themselves
      return await ctx.db.query("users").filter(q => q.neq(q.field("_id"), userId)).collect();
    }

    // Direct reportees
    return await ctx.db.query("users")
      .withIndex("managerId", (q) => q.eq("managerId", userId))
      .collect();
  },
});

// ─── Assign Challenge ──────────────────────────────────────────────────────

export const assignChallenge = authMutation({
  args: {
    assigneeId: v.id("users"),
    title: v.string(),
    description: v.string(),
    rewardXP: v.number(),
    rewardBadgeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const assignerId = await getAuthUserId(ctx);
    if (!assignerId) throw new Error("Unauthorized");

    // Ensure the assigner is a manager of the assignee (or super_admin)
    const assigner = await ctx.db.get(assignerId);
    const assignee = await ctx.db.get(args.assigneeId);
    
    if (!assigner || !assignee) throw new Error("User not found");
    
    const isSuperAdmin = assigner.role === "super_admin";
    const isDirectManager = assignee.managerId === assignerId;
    
    // For this demonstration, we allow super admins and direct managers. 
    // We could recursively check the tree, but let's keep it simple.
    if (!isSuperAdmin && !isDirectManager) {
      throw new Error("You can only assign challenges to your direct reportees.");
    }

    const assignedChallengeId = await ctx.db.insert("assignedChallenges", {
      assignerId,
      assigneeId: args.assigneeId,
      title: args.title,
      description: args.description,
      rewardXP: args.rewardXP,
      rewardBadgeId: args.rewardBadgeId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Notify the assignee
    await ctx.db.insert("notifications", {
      employeeId: args.assigneeId,
      type: "system",
      title: "New Challenge Assigned!",
      message: `${assigner.name} assigned you a new challenge: "${args.title}" for ${args.rewardXP} XP.`,
      read: false,
      createdAt: Date.now(),
    });

    return assignedChallengeId;
  },
});

// ─── Get Delegated Challenges (For Executive) ─────────────────────────────

export const getMyDelegatedChallenges = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const challenges = await ctx.db.query("assignedChallenges")
      .withIndex("assigneeId", (q) => q.eq("assigneeId", userId))
      .order("desc")
      .collect();

    // Enrich with assigner info
    return Promise.all(
      challenges.map(async (c) => {
        const assigner = await ctx.db.get(c.assignerId);
        return { ...c, assignerName: assigner?.name ?? "Manager" };
      })
    );
  },
});

// ─── Get Challenges Delegated By Me (For Manager) ──────────────────────────

export const getChallengesDelegatedByMe = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const challenges = await ctx.db.query("assignedChallenges")
      .withIndex("assignerId", (q) => q.eq("assignerId", userId))
      .order("desc")
      .collect();

    // Enrich with assignee info
    return Promise.all(
      challenges.map(async (c) => {
        const assignee = await ctx.db.get(c.assigneeId);
        return { ...c, assigneeName: assignee?.name ?? "Employee" };
      })
    );
  },
});

// ─── Submit for Approval ───────────────────────────────────────────────────

export const submitChallengeForApproval = authMutation({
  args: {
    challengeId: v.id("assignedChallenges"),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.assigneeId !== userId) throw new Error("Not your challenge");
    if (challenge.status !== "assigned" && challenge.status !== "rejected") {
      throw new Error("Challenge is already submitted or approved.");
    }

    await ctx.db.patch(args.challengeId, {
      status: "pending_approval",
      completedAt: Date.now(),
      comments: args.comments ? `Employee: ${args.comments}` : undefined,
    });

    const user = await ctx.db.get(userId);

    // Notify the manager
    await ctx.db.insert("notifications", {
      employeeId: challenge.assignerId,
      type: "system",
      title: "Challenge Approval Requested",
      message: `${user?.name} has completed "${challenge.title}" and is requesting approval.`,
      read: false,
      createdAt: Date.now(),
    });

    return true;
  },
});

// ─── Approve Challenge ─────────────────────────────────────────────────────

export const approveChallenge = authMutation({
  args: {
    challengeId: v.id("assignedChallenges"),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const managerId = await getAuthUserId(ctx);
    if (!managerId) throw new Error("Unauthorized");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.assignerId !== managerId) throw new Error("Not authorized");
    if (challenge.status !== "pending_approval") throw new Error("Not pending approval");

    const now = Date.now();

    await ctx.db.patch(args.challengeId, {
      status: "approved",
      approvedAt: now,
      comments: args.comments ? `Manager: ${args.comments}` : challenge.comments,
    });

    // Award XP to the assignee
    const assignee = await ctx.db.get(challenge.assigneeId);
    if (assignee) {
      const newXP = (assignee.totalXP ?? 0) + challenge.rewardXP;
      const levelInfo = getLevelProgress(newXP);
      
      let badgeIds = assignee.badgeIds ?? [];
      if (challenge.rewardBadgeId && !badgeIds.includes(challenge.rewardBadgeId)) {
        badgeIds.push(challenge.rewardBadgeId);
      }

      await ctx.db.patch(challenge.assigneeId, {
        totalXP: newXP,
        level: levelInfo.level,
        rank: levelInfo.title,
        badgeIds,
      });

      // Transaction log
      await ctx.db.insert("xpTransactions", {
        employeeId: challenge.assigneeId,
        amount: challenge.rewardXP,
        eventType: "challenge_completed",
        description: `Completed delegated challenge: ${challenge.title}`,
        balance: newXP,
        timestamp: now,
      });

      // Flow 10% XP up to the manager as a "Management Bonus"
      const managerBonus = Math.floor(challenge.rewardXP * 0.1);
      if (managerBonus > 0) {
        const manager = await ctx.db.get(managerId);
        if (manager) {
          const mNewXP = (manager.totalXP ?? 0) + managerBonus;
          const mLevelInfo = getLevelProgress(mNewXP);
          await ctx.db.patch(managerId, {
            totalXP: mNewXP,
            level: mLevelInfo.level,
            rank: mLevelInfo.title,
          });

          await ctx.db.insert("xpTransactions", {
            employeeId: managerId,
            amount: managerBonus,
            eventType: "management_bonus",
            description: `Bonus for ${assignee.name} completing challenge`,
            balance: mNewXP,
            timestamp: now,
          });
        }
      }

      // Notify the assignee
      await ctx.db.insert("notifications", {
        employeeId: challenge.assigneeId,
        type: "challenge_completed",
        title: "Challenge Approved! 🎉",
        message: `Your manager approved "${challenge.title}". You earned ${challenge.rewardXP} XP!`,
        read: false,
        createdAt: now,
      });

      // Activity Feed
      await ctx.db.insert("activities", {
        employeeId: challenge.assigneeId,
        type: "achievement",
        message: `${assignee.name} crushed a delegated challenge: "${challenge.title}"! 🚀`,
        likes: [],
        comments: [],
        createdAt: now,
      });
    }

    return true;
  },
});

// ─── Reject Challenge ──────────────────────────────────────────────────────

export const rejectChallenge = authMutation({
  args: {
    challengeId: v.id("assignedChallenges"),
    comments: v.string(),
  },
  handler: async (ctx, args) => {
    const managerId = await getAuthUserId(ctx);
    if (!managerId) throw new Error("Unauthorized");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.assignerId !== managerId) throw new Error("Not authorized");
    if (challenge.status !== "pending_approval") throw new Error("Not pending approval");

    await ctx.db.patch(args.challengeId, {
      status: "rejected",
      comments: `Rejected: ${args.comments}`,
    });

    // Notify the assignee
    await ctx.db.insert("notifications", {
      employeeId: challenge.assigneeId,
      type: "system",
      title: "Challenge Rejected",
      message: `Your manager requested changes for "${challenge.title}": ${args.comments}`,
      read: false,
      createdAt: Date.now(),
    });

    return true;
  },
});
