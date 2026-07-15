import { v } from "convex/values";
import { authQuery, authMutation } from "./customAuth";
import { Id } from "./_generated/dataModel";

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

// Recursive passive hierarchy XP function
async function distributeHierarchyXP(ctx: any, sourceUserId: Id<"users">, baseXP: number, eventType: string) {
  let currentUser = await ctx.db.get(sourceUserId);
  if (!currentUser || !currentUser.managerId) return;

  const hierarchyDistribution = [0.24, 0.16, 0.12, 0.08, 0.04]; // Approx: 60, 40, 30, 20, 10 from 250
  
  let currentManagerId = currentUser.managerId;
  let level = 0;
  
  while (currentManagerId && level < hierarchyDistribution.length) {
    const manager = await ctx.db.get(currentManagerId);
    if (!manager) break;

    const passiveXP = Math.round(baseXP * hierarchyDistribution[level]);
    if (passiveXP > 0) {
      await ctx.db.insert("hierarchyRewards", {
        sourceEmployeeId: sourceUserId,
        targetEmployeeId: manager._id,
        eventType,
        sourceXP: baseXP,
        hierarchyXP: passiveXP,
        hierarchyLevel: level + 1,
        timestamp: Date.now(),
      });

      // Update manager's totalXP
      const managerBalance = (manager.totalXP || 0) + passiveXP;
      await ctx.db.patch(manager._id, { totalXP: managerBalance });

      // Log transaction
      await ctx.db.insert("xpTransactions", {
        employeeId: manager._id,
        amount: passiveXP,
        eventType: `Passive XP (${eventType})`,
        description: `Team Performance Bonus from ${currentUser.name}`,
        balance: managerBalance,
        timestamp: Date.now(),
      });
    }

    currentManagerId = manager.managerId;
    level++;
  }
}

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

    // 4. Award XP (only if a real user submitted it, reception desk doesn't need to earn XP, but we can award it anyway)
    const user = await ctx.db.get(assigneeId);
    const xp = XP_AWARDS["enquiry"];
    if (user && xp) {
      const balance = (user.totalXP || 0) + xp;
      await ctx.db.patch(assigneeId, { totalXP: balance });
      await ctx.db.insert("xpTransactions", {
        employeeId: assigneeId,
        amount: xp,
        eventType: "Enquiry Created",
        description: `New lead: ${args.customerName}`,
        balance,
        timestamp: Date.now(),
      });
      await distributeHierarchyXP(ctx, assigneeId, xp, "Enquiry Created");
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

    // Award XP
    const user = await ctx.db.get(ctx.userId);
    const xp = XP_AWARDS[args.newStage] || 10; // Default 10 XP for moving workflow
    if (user && xp) {
      const balance = (user.totalXP || 0) + xp;
      await ctx.db.patch(ctx.userId, { totalXP: balance });
      await ctx.db.insert("xpTransactions", {
        employeeId: ctx.userId,
        amount: xp,
        eventType: `Stage: ${args.newStage}`,
        description: `Advanced to ${args.newStage}`,
        balance,
        timestamp: Date.now(),
      });
      await distributeHierarchyXP(ctx, ctx.userId, xp, `Stage: ${args.newStage}`);
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
