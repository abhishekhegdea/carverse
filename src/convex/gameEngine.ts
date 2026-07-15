import { v } from "convex/values";
import { ROLES } from "./schema";
import { Id } from "./_generated/dataModel";

export const ROLE_MULTIPLIERS: Record<string, number> = {
  [ROLES.CUSTOMER]: 0.0,
  [ROLES.SUPER_ADMIN]: 1.0,
  "reception": 0.8,
  [ROLES.SALES_EXECUTIVE]: 1.4,
  [ROLES.SALES_MANAGER]: 1.5,
  [ROLES.FINANCE_EXECUTIVE]: 1.2,
  "finance_manager": 1.3,
};

export const getRoleMultiplier = (role?: string) => {
  if (!role) return 1.0;
  if (role === "dse") return 1.0;
  return ROLE_MULTIPLIERS[role] || 1.0;
};

const ANTI_GAMING_MAX_ACTIONS_PER_QUEST = 20;
const ANTI_GAMING_DUPLICATE_TIME_WINDOW_MS = 1000 * 60 * 5; // 5 minutes

export async function calculateMathematicalXP(
  ctx: any, 
  args: {
    employeeId: Id<"users">,
    saleId?: Id<"sales">,
    actionType: string,
    baseValue: number,
    difficultyMultiplier?: number,
    timeEfficiency?: number,
    csatScore?: number,
    qualityScore?: number,
    teamBonus?: number,
  }
) {
  // 1. Anti-Gaming Check
  if (args.saleId) {
    const totalActions = await ctx.db
      .query("antiGamingLogs")
      .withIndex("saleId", (q: any) => q.eq("saleId", args.saleId))
      .filter((q: any) => q.eq(q.field("employeeId"), args.employeeId))
      .collect();

    if (totalActions.length >= ANTI_GAMING_MAX_ACTIONS_PER_QUEST) {
      console.log(`Anti-Gaming: Max actions (${ANTI_GAMING_MAX_ACTIONS_PER_QUEST}) reached for sale ${args.saleId}`);
      return 0; // No XP
    }

    const recentDuplicates = totalActions.filter(
      (log: any) => log.actionType === args.actionType && (Date.now() - log.timestamp) < ANTI_GAMING_DUPLICATE_TIME_WINDOW_MS
    );

    if (recentDuplicates.length > 0) {
      console.log(`Anti-Gaming: Duplicate action ${args.actionType} within time window.`);
      return 0; // No XP
    }

    await ctx.db.insert("antiGamingLogs", {
      employeeId: args.employeeId,
      saleId: args.saleId,
      actionType: args.actionType,
      timestamp: Date.now(),
    });
  }

  const employee = await ctx.db.get(args.employeeId);
  if (!employee) return 0;

  // 2. Fetch Branch for Normalization
  let branchMultiplier = 1.0;
  if (employee.branch) {
    const dealer = await ctx.db
      .query("dealers")
      .filter((q: any) => q.eq(q.field("name"), employee.branch))
      .first();
    
    if (dealer && dealer.footfall && dealer.averageFootfall) {
      branchMultiplier = dealer.averageFootfall / dealer.footfall;
      branchMultiplier = Math.max(0.5, Math.min(2.0, branchMultiplier));
    }
  }

  // 3. Gather multipliers
  const roleMultiplier = getRoleMultiplier(employee.role);
  const difficultyMultiplier = args.difficultyMultiplier ?? 1.0;
  const timeEfficiency = args.timeEfficiency ?? 1.0;
  const csatMultiplier = args.csatScore ? args.csatScore / 5 : 1.0;
  const qualityMultiplier = args.qualityScore ?? 1.0;
  const teamBonus = args.teamBonus ?? 1.0;

  // 4. Mathematical Formula
  const finalXP = Math.round(
    args.baseValue *
    difficultyMultiplier *
    branchMultiplier *
    timeEfficiency *
    csatMultiplier *
    qualityMultiplier *
    roleMultiplier *
    teamBonus
  );

  // 5. Award XP
  if (finalXP > 0) {
    const newXP = (employee.totalXP || 0) + finalXP;
    
    await ctx.db.patch(args.employeeId, {
      totalXP: newXP,
    });

    await ctx.db.insert("xpTransactions", {
      employeeId: args.employeeId,
      amount: finalXP,
      eventType: args.actionType,
      description: `Formula: Base(${args.baseValue})*Diff(${difficultyMultiplier})*Branch(${branchMultiplier.toFixed(2)})*Time(${timeEfficiency})*CSAT(${csatMultiplier})*Qual(${qualityMultiplier})*Role(${roleMultiplier})*Team(${teamBonus})`,
      balance: newXP,
      timestamp: Date.now(),
    });
  }

  return finalXP;
}
