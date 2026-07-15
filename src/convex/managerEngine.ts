import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { ROLES } from "./schema";
import { Id } from "./_generated/dataModel";

const MAX_RECOGNITION_XP_PER_MONTH = 500;

export async function calculateAndAwardLeadershipXP(
  ctx: any,
  args: {
    managerId: Id<"users">,
    teamAverageScore: number,
    mentorshipMultiplier?: number,
    completionPercentage?: number,
  }
) {
  const manager = await ctx.db.get(args.managerId);
  if (!manager) return 0;

  const mentorship = args.mentorshipMultiplier ?? 1.1;
  const completion = args.completionPercentage ?? 1.0; 

  const leadershipXP = Math.round(args.teamAverageScore * mentorship * completion);

  if (leadershipXP > 0) {
    const newScore = (manager.leadershipScore || 0) + leadershipXP;
    await ctx.db.patch(args.managerId, {
      leadershipScore: newScore,
    });

    await ctx.db.insert("notifications", {
      employeeId: args.managerId,
      type: "appreciation",
      title: "Leadership XP Earned",
      message: `Your team's performance earned you +${leadershipXP} Leadership XP!`,
      read: false,
      createdAt: Date.now(),
    });
  }

  return leadershipXP;
}

export const awardRecognitionXP = mutation({
  args: {
    managerId: v.id("users"),
    employeeId: v.id("users"),
    reason: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const manager = await ctx.db.get(args.managerId);
    const employee = await ctx.db.get(args.employeeId);

    if (!manager || !employee) throw new Error("User not found");

    const validManagerRoles = [
      ROLES.SUPER_ADMIN, 
      ROLES.BRANCH_MANAGER, 
      ROLES.SALES_MANAGER, 
      ROLES.REGIONAL_DIRECTOR, 
      ROLES.REGIONAL_MANAGER,
      "finance_manager"
    ];

    if (!validManagerRoles.includes(manager.role as string)) {
      throw new Error("You do not have permission to award recognition XP");
    }

    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentAwards = await ctx.db
      .query("recognitionXP")
      .withIndex("managerId", (q: any) => q.eq("managerId", args.managerId))
      .filter((q: any) => q.gte(q.field("timestamp"), oneMonthAgo))
      .collect();

    const totalAwardedRecently = recentAwards.reduce((sum: number, award: any) => sum + award.amount, 0);

    if (totalAwardedRecently + args.amount > MAX_RECOGNITION_XP_PER_MONTH) {
      throw new Error(`Monthly recognition cap exceeded. You can only award ${MAX_RECOGNITION_XP_PER_MONTH - totalAwardedRecently} more XP this month.`);
    }

    await ctx.db.insert("recognitionXP", {
      managerId: args.managerId,
      employeeId: args.employeeId,
      reason: args.reason,
      amount: args.amount,
      timestamp: Date.now(),
    });

    const newXP = (employee.totalXP || 0) + args.amount;
    await ctx.db.patch(args.employeeId, { totalXP: newXP });

    await ctx.db.insert("xpTransactions", {
      employeeId: args.employeeId,
      amount: args.amount,
      eventType: "recognition",
      description: `Recognition from Manager: ${args.reason}`,
      balance: newXP,
      timestamp: Date.now(),
    });

    await ctx.db.insert("activities", {
      employeeId: args.employeeId,
      type: "appreciation",
      message: `${employee.name} received +${args.amount} Recognition XP for: ${args.reason}`,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    });

    return true;
  },
});
