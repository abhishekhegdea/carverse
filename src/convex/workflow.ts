import { v } from "convex/values";
import { authQuery, authMutation } from "./customAuth";
import { Id } from "./_generated/dataModel";
import { calculateMathematicalXP } from "./gameEngine";
import { calculateAndAwardLeadershipXP } from "./managerEngine";
import { checkAndProcessPromotion } from "./promotionEngine";
import { awardCoins } from "./economyEngine";
import { updateMissionProgress } from "./missionEngine";

const STAGES = [
  "enquiry", "assigned", "contacted", "visited", "test_drive", "quotation",
  "negotiation", "booked", "finance", "payment", "allocation", "accessories",
  "insurance", "registration", "invoice", "pdi", "ready", "delivered", "feedback"
];

const XP_AWARDS: Record<string, number> = {
  "enquiry": 5,
  "test_drive": 20,
  "quotation": 30,
  "booked": 60,
  "finance": 100,
  "delivered": 250,
  "feedback": 80,
  "accessories": 40,
  "insurance": 50,
};

// Removed old passive hierarchy function in favor of Leadership XP calculation.

export const getPipeline = authQuery({
  args: {},
  handler: async (ctx, args) => {
    if (!ctx.userId) return [];
    const user = await ctx.db.get(ctx.userId);
    if (!user) return [];

    let sales;
    // Salesperson only sees their own
    if (user.role === "salesperson" || user.role === "sales_executive") {
      sales = await ctx.db.query("sales")
        .withIndex("employeeId", q => q.eq("employeeId", ctx.userId))
        .collect();
    } else {
      // Managers see everything for now (can be optimized to check managerId chain)
      sales = await ctx.db.query("sales").collect();
    }

    return sales.filter((s: any) => s.status !== "delivered" && s.status !== "cancelled");
  },
});

export const createEnquiry = authMutation({
  args: {
    customerName: v.string(),
    phone: v.string(),
    carType: v.string(),
    carModel: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    let assigneeId = ctx.userId;
    if (!assigneeId) {
      let receptionUser = await ctx.db.query("users").filter(q => q.eq(q.field("name"), "Reception Desk")).first();
      if (!receptionUser) {
        const newReceptionId = await ctx.db.insert("users", {
          name: "Reception Desk",
          email: "reception@carverse.com",
          role: "sales_executive",
          department: "Sales",
          designation: "Receptionist",
          level: 1,
          totalXP: 0,
          rank: "Rookie",
          createdAt: Date.now(),
        });
        assigneeId = newReceptionId;
      } else {
        assigneeId = receptionUser._id;
      }
    }

    // 1. Create Customer
    const customerId = await ctx.db.insert("customers", {
      name: args.customerName,
      phone: args.phone,
      createdAt: Date.now(),
    });

    // 2. Create Enquiry in Pipeline
    const saleId = await ctx.db.insert("sales", {
      employeeId: assigneeId,
      customerId,
      customerName: args.customerName,
      carType: args.carType as any,
      carModel: args.carModel,
      amount: args.amount,
      status: "enquiry",
      hasInsurance: false,
      hasAccessories: false,
      hasExchange: false,
      bookingDate: Date.now(),
      createdAt: Date.now(),
    });

    // 3. Log History
    await ctx.db.insert("workflowHistory", {
      saleId,
      newStage: "enquiry",
      changedBy: assigneeId,
      comments: "Lead Captured",
      timestamp: Date.now(),
    });

    // 4. Award XP using the new Mathematical Game Engine
    const user = await ctx.db.get(assigneeId);
    const xpBase = XP_AWARDS["enquiry"] || 5;
    if (user && xpBase) {
      const earnedXP = await calculateMathematicalXP(ctx, {
        employeeId: assigneeId,
        saleId,
        actionType: "Enquiry Created",
        baseValue: xpBase,
        difficultyMultiplier: 1.0,
      });

      if (earnedXP > 0) {
        // Enquiries might earn a small coin reward
        await awardCoins(ctx, {
          employeeId: assigneeId,
          amount: 5,
          reason: "Enquiry Captured",
        });
      }
    }

    return saleId;
  },
});

export const advanceStage = authMutation({
  args: {
    saleId: v.id("sales"),
    newStage: v.string(),
    comments: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!ctx.userId) throw new Error("Unauthorized");
    
    const sale = await ctx.db.get(args.saleId);
    if (!sale) throw new Error("Sale not found");

    const previousStage = sale.status;

    // Update Status & Ownership if transferred
    const patchData: any = { status: args.newStage };
    if (args.assigneeId) {
      patchData.employeeId = args.assigneeId;
    }

    await ctx.db.patch(args.saleId, patchData);

    // Log History
    await ctx.db.insert("workflowHistory", {
      saleId: args.saleId,
      previousStage,
      newStage: args.newStage,
      changedBy: ctx.userId,
      comments: args.comments,
      timestamp: Date.now(),
    });

    // Award XP using Game Engine
    const user = await ctx.db.get(ctx.userId);
    const xpBase = XP_AWARDS[args.newStage] || 10;
    
    if (user && xpBase) {
      // Pass difficulty or CSAT from sale record if it exists
      const earnedXP = await calculateMathematicalXP(ctx, {
        employeeId: ctx.userId,
        saleId: args.saleId,
        actionType: `Stage: ${args.newStage}`,
        baseValue: xpBase,
        difficultyMultiplier: sale.difficultyMultiplier || 1.0,
        timeEfficiency: sale.timeEfficiency || 1.0,
        csatScore: sale.csatScore,
        qualityScore: sale.qualityScore,
      });

      // If XP was awarded (anti-gaming logic passed)
      if (earnedXP > 0) {
        // Award Coins for completing a quest milestone
        const coinReward = Math.round(xpBase / 2); // E.g., 50 coins for 100 base XP
        await awardCoins(ctx, {
          employeeId: ctx.userId,
          amount: coinReward,
          reason: `Milestone reached: ${args.newStage}`,
        });

        // Award Leadership XP to manager (if any)
        if (user.managerId) {
          // Simplification: We assume team average score is somehow derived from baseXP or we just pass baseXP
          await calculateAndAwardLeadershipXP(ctx, {
            managerId: user.managerId,
            teamAverageScore: xpBase,
            mentorshipMultiplier: 1.1,
            completionPercentage: 1.0, 
          });
        }

        // Check for promotion after this milestone
        await checkAndProcessPromotion(ctx, {
          employeeId: ctx.userId,
          averageCsatScore: sale.csatScore || 5.0, // simplified
          questCompletionPercentage: 1.0,
        });

        // Trigger Quest Engine / Mission Progress
        // Normalize the actionType string. e.g. "booked" -> "booking", "quotation" -> "quotation", "delivered" -> "delivery", "test_drive" -> "test_drive"
        let actionType = args.newStage;
        if (actionType === "booked") actionType = "booking";
        if (actionType === "delivered") actionType = "delivery";
        
        await updateMissionProgress(ctx, ctx.userId, actionType, 1);
      }
    }
  },
});

export const getEmployeesByRole = authQuery({
  args: {
    roles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (!ctx.userId) return [];
    
    // Fetch all users matching the roles
    const users = await ctx.db.query("users").collect();
    return users.filter(u => u.role && args.roles.includes(u.role)).map(u => ({
      _id: u._id,
      name: u.name,
      role: u.role,
      branch: u.branch,
      level: u.level,
    }));
  }
});
