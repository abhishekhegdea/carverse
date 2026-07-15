import { v } from "convex/values";
import { ROLES } from "./schema";
import { Id } from "./_generated/dataModel";

const CAREER_LADDER = [
  { role: "dse", requiredXP: 0, requiredLeadership: 0, title: "DSE" },
  { role: "senior_dse", requiredXP: 5000, requiredLeadership: 500, title: "Senior DSE" },
  { role: ROLES.SALES_EXECUTIVE, requiredXP: 15000, requiredLeadership: 2000, title: "Sales Executive" },
  { role: "senior_sales_executive", requiredXP: 30000, requiredLeadership: 5000, title: "Senior Sales Executive" },
  { role: ROLES.SALES_MANAGER, requiredXP: 60000, requiredLeadership: 12000, title: "Sales Manager" },
  { role: ROLES.BRANCH_MANAGER, requiredXP: 120000, requiredLeadership: 30000, title: "Branch Manager" },
  { role: ROLES.REGIONAL_MANAGER, requiredXP: 250000, requiredLeadership: 80000, title: "Regional Manager" },
  { role: ROLES.REGIONAL_DIRECTOR, requiredXP: 500000, requiredLeadership: 150000, title: "Regional Director" },
];

export async function checkAndProcessPromotion(
  ctx: any,
  args: {
    employeeId: Id<"users">,
    questCompletionPercentage?: number,
    averageCsatScore?: number,
  }
) {
  const employee = await ctx.db.get(args.employeeId);
  if (!employee) return false;

  const currentRole = employee.role || "dse";
  const currentLadderIndex = CAREER_LADDER.findIndex(l => l.role === currentRole);
  
  if (currentLadderIndex === -1 || currentLadderIndex === CAREER_LADDER.length - 1) return false;

  const nextTier = CAREER_LADDER[currentLadderIndex + 1];

  const xp = employee.totalXP || 0;
  const leadership = employee.leadershipScore || 0;
  const csat = args.averageCsatScore || 5.0;
  const completion = args.questCompletionPercentage || 1.0;
  const consistencyScore = employee.streak || 0;

  const hasEnoughXP = xp >= nextTier.requiredXP;
  const hasEnoughLeadership = leadership >= nextTier.requiredLeadership;
  const hasGoodCsat = csat >= 4.0;
  const hasGoodCompletion = completion >= 0.8;

  const promotionScore = (xp / Math.max(1, nextTier.requiredXP)) * 100 
    + (leadership / Math.max(1, nextTier.requiredLeadership)) * 50
    + (csat * 10)
    + (completion * 50)
    + Math.min(consistencyScore, 100);

  await ctx.db.patch(args.employeeId, { promotionScore });

  if (hasEnoughXP && hasEnoughLeadership && hasGoodCsat && hasGoodCompletion) {
    await ctx.db.patch(args.employeeId, {
      role: nextTier.role as any,
      designation: nextTier.title,
    });

    await ctx.db.insert("activities", {
      employeeId: args.employeeId,
      type: "promotion",
      message: `${employee.name} has been promoted to ${nextTier.title}! Watch them overtake their manager on the podium! 🚀🎊`,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    });

    return true;
  }

  return false;
}
