import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery } from "./customAuth";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Constants ─────────────────────────────────────────────────────────────

const ROLE_MULTIPLIERS: Record<string, number> = {
  sales_executive: 1.0,
  team_leader: 1.2,
  sales_manager: 1.5,
  branch_manager: 2.0,
  finance_executive: 1.1,
  insurance_executive: 1.1,
};

function getSeasonMultiplier(): number {
  const month = new Date().getMonth();
  // Example: Oct-Dec is festival season in India (Diwali, etc.)
  if (month >= 9 && month <= 11) return 1.2;
  // March is year-end closing
  if (month === 2) return 1.15;
  return 1.0;
}

// ─── Mission Generation ────────────────────────────────────────────────────

export const generateDailyMissions = internalMutation({
  args: {
    employeeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    // Fetch Branch & City Statistics
    let branchPerfMult = 1.0;
    let cityMult = 1.10; // Default Tier 2

    if (employee.branch) {
      const branchStats = await ctx.db.query("branch_statistics")
        .withIndex("branchId", (q) => q.eq("branchId", employee.branch!))
        .first();
      
      if (branchStats) {
        branchPerfMult = branchStats.currentPerformance > 0 ? branchStats.currentPerformance : 1.0;
        
        const cityStats = await ctx.db.get(branchStats.cityId);
        if (cityStats) {
          cityMult = cityStats.baseMultiplier;
        }
      }
    }

    const roleMult = ROLE_MULTIPLIERS[employee.role as string] || 1.0;
    const seasonMult = getSeasonMultiplier();

    // Fetch active daily templates
    const templates = await ctx.db.query("mission_templates")
      .withIndex("periodType", (q) => q.eq("periodType", "daily"))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime();
    const end = start + 24 * 60 * 60 * 1000 - 1;

    for (const template of templates) {
      // Check if already assigned today
      const existing = await ctx.db.query("missions")
        .withIndex("employeeId_status", (q) => q.eq("employeeId", args.employeeId).eq("status", "active"))
        .filter((q) => q.eq(q.field("templateId"), template._id))
        .first();

      if (existing) continue;

      // Mission Target = Base Target × City Multiplier × Role Multiplier × Season Multiplier × Branch Performance Multiplier
      let calculatedTarget = template.baseTarget * cityMult * roleMult * seasonMult * branchPerfMult;
      calculatedTarget = Math.max(1, Math.round(calculatedTarget));

      // XP = Base XP × Difficulty Multiplier (approximated by Season*Branch) × City Multiplier × Quality Multiplier
      let calculatedXP = template.baseXP * (seasonMult * branchPerfMult) * cityMult * template.qualityMultiplier;
      calculatedXP = Math.round(calculatedXP);

      const calculatedCoins = Math.round(calculatedXP / 4);

      // Insert Mission
      const missionId = await ctx.db.insert("missions", {
        templateId: template._id,
        employeeId: args.employeeId,
        branchId: employee.branch,
        calculatedTarget,
        calculatedXP,
        calculatedCoins,
        periodStart: start,
        periodEnd: end,
        status: "active",
      });

      // Insert Progress
      await ctx.db.insert("mission_progress", {
        missionId,
        employeeId: args.employeeId,
        currentProgress: 0,
        target: calculatedTarget,
        completed: false,
      });
    }
  }
});

// ─── Global Mission Generation ─────────────────────────────────────────────

export const generateAllMissions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    for (const user of allUsers) {
      // In a real app we would dispatch to an action or use a batch logic, 
      // but doing it inline here for simplicity since it's just generating for users.
      // We'll duplicate the logic to avoid calling another mutation inside a mutation.
      
      const periods = ["daily", "weekly", "monthly"] as const;

      for (const period of periods) {
        const templates = await ctx.db.query("mission_templates")
          .withIndex("periodType", (q) => q.eq("periodType", period))
          .filter((q) => q.eq(q.field("active"), true))
          .collect();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = today.getTime();
        
        let end = start + 24 * 60 * 60 * 1000 - 1;
        if (period === "weekly") {
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(today.setDate(diff));
          end = weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1;
        } else if (period === "monthly") {
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          end = nextMonth.getTime() - 1;
        }

        for (const template of templates) {
          const existing = await ctx.db.query("missions")
            .withIndex("employeeId_status", (q) => q.eq("employeeId", user._id).eq("status", "active"))
            .filter((q) => q.eq(q.field("templateId"), template._id))
            .first();

          if (existing) continue;

          let calculatedTarget = template.baseTarget;
          let calculatedXP = template.baseXP;
          const calculatedCoins = Math.round(calculatedXP / 4);

          const missionId = await ctx.db.insert("missions", {
            templateId: template._id,
            employeeId: user._id,
            branchId: user.branch,
            calculatedTarget,
            calculatedXP,
            calculatedCoins,
            periodStart: start,
            periodEnd: end,
            status: "active",
          });

          await ctx.db.insert("mission_progress", {
            missionId,
            employeeId: user._id,
            currentProgress: 0,
            target: calculatedTarget,
            completed: false,
          });
        }
      }
    }
  }
});

// ─── Initialize Mission Templates ──────────────────────────────────────────

export const initializeMissionTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("mission_templates").collect();
    if (existing.length > 0) return; // already initialized

    const templates = [
      {
        name: "Test Drive Trio",
        description: "Complete 3 test drives today",
        actionType: "test_drive" as const,
        baseTarget: 3,
        baseXP: 100,
        periodType: "daily" as const,
        qualityMultiplier: 1.0,
        active: true,
      },
      {
        name: "Finance Finisher",
        description: "Complete 2 finance approvals",
        actionType: "finance" as const,
        baseTarget: 2,
        baseXP: 150,
        periodType: "daily" as const,
        qualityMultiplier: 1.2,
        active: true,
      },
      {
        name: "Delivery Master",
        description: "Deliver 1 vehicle today",
        actionType: "delivery" as const,
        baseTarget: 1,
        baseXP: 200,
        periodType: "daily" as const,
        qualityMultiplier: 1.5,
        active: true,
      },
      {
        name: "Booking Star",
        description: "Create 3 new bookings",
        actionType: "booking" as const,
        baseTarget: 3,
        baseXP: 120,
        periodType: "daily" as const,
        qualityMultiplier: 1.0,
        active: true,
      },
      // Weekly templates
      {
        name: "Weekly Deliveries",
        description: "Complete 10 deliveries this week",
        actionType: "delivery" as const,
        baseTarget: 10,
        baseXP: 800,
        periodType: "weekly" as const,
        qualityMultiplier: 1.0,
        active: true,
      },
      // Monthly templates
      {
        name: "Monthly Bookings",
        description: "Create 30 bookings this month",
        actionType: "booking" as const,
        baseTarget: 30,
        baseXP: 2500,
        periodType: "monthly" as const,
        qualityMultiplier: 1.0,
        active: true,
      }
    ];

    for (const t of templates) {
      await ctx.db.insert("mission_templates", t);
    }
  }
});

// ─── Fetching Data for UI ──────────────────────────────────────────────────

export const getMyActiveMissions = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const activeMissions = await ctx.db.query("missions")
      .withIndex("employeeId_status", (q) => q.eq("employeeId", userId).eq("status", "active"))
      .collect();

    const enriched = await Promise.all(
      activeMissions.map(async (mission) => {
        const template = await ctx.db.get(mission.templateId);
        const progress = await ctx.db.query("mission_progress")
          .withIndex("missionId", (q) => q.eq("missionId", mission._id))
          .first();

        return {
          ...mission,
          template,
          progress,
        };
      })
    );

    return enriched;
  }
});

// ─── Quest / Mission Progress Updater ──────────────────────────────────────

export async function updateMissionProgress(ctx: any, employeeId: Id<"users">, actionType: string, quantity = 1) {
  const activeMissions = await ctx.db.query("missions")
    .withIndex("employeeId_status", (q: any) => q.eq("employeeId", employeeId).eq("status", "active"))
    .collect();

  for (const mission of activeMissions) {
    const template = await ctx.db.get(mission.templateId);
    if (!template) continue;

    if (template.actionType === actionType) {
      const progress = await ctx.db.query("mission_progress")
        .withIndex("missionId", (q: any) => q.eq("missionId", mission._id))
        .first();

      if (progress && !progress.completed) {
        const newProgress = Math.min(progress.target, progress.currentProgress + quantity);
        const completed = newProgress >= progress.target;

        await ctx.db.patch(progress._id, {
          currentProgress: newProgress,
          completed,
          completedAt: completed ? Date.now() : undefined,
        });

        if (completed) {
          await ctx.db.patch(mission._id, { status: "completed" });
          
          // Award XP and Coins via existing engine
          // Assuming gameEngine's calculateMathematicalXP can be used or direct patch
          const user = await ctx.db.get(employeeId);
          if (user) {
            await ctx.db.patch(employeeId, {
              totalXP: (user.totalXP || 0) + mission.calculatedXP,
              coins: (user.coins || 0) + mission.calculatedCoins,
            });
            // Also log the transaction
            await ctx.db.insert("xpTransactions", {
              employeeId,
              amount: mission.calculatedXP,
              eventType: "mission_completed",
              description: `Completed Mission: ${template.name}`,
              balance: (user.totalXP || 0) + mission.calculatedXP,
              timestamp: Date.now(),
            });
          }
        }
      }
    }
  }
}

