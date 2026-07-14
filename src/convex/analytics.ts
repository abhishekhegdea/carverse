import { authQuery, authMutation } from "./customAuth";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "./authHelper";

// ─── Dashboard Stats ───────────────────────────────────────────────────────

export const getDashboardStats = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    // Sales stats
    const mySales = await ctx.db.query("sales")
      .withIndex("employeeId", (q: any) => q.eq("employeeId", userId))
      .collect();

    const totalSales = mySales.length;
    const deliveredSales = mySales.filter(s => s.status === "delivered").length;
    const pendingFinance = mySales.filter(s => s.status === "finance_pending").length;
    const pendingRegistration = mySales.filter(s => s.status === "registration_pending").length;
    const pendingDelivery = mySales.filter(s => s.status === "finance_approved" || s.status === "invoice_generated").length;
    const cancelledSales = mySales.filter(s => s.status === "cancelled").length;
    const totalRevenue = mySales.reduce((sum, s) => sum + (s.status === "delivered" ? s.amount : 0), 0);

    // Conversion rate (delivered / total bookings)
    const conversionRate = totalSales > 0 ? (deliveredSales / totalSales) * 100 : 0;

    // Monthly stats
    const monthlySales = mySales.filter(s => s.bookingDate >= monthStart.getTime());
    const monthlyDelivered = monthlySales.filter(s => s.status === "delivered").length;
    const monthlyRevenue = monthlySales.reduce((sum, s) => sum + (s.status === "delivered" ? s.amount : 0), 0);

    // Sales by car type
    const salesByType = {
      passenger: mySales.filter(s => s.carType === "passenger").length,
      suv: mySales.filter(s => s.carType === "suv").length,
      luxury: mySales.filter(s => s.carType === "luxury").length,
      commercial: mySales.filter(s => s.carType === "commercial").length,
      electric: mySales.filter(s => s.carType === "electric").length,
    };

    // XP stats
    const xpTransactions = await ctx.db.query("xpTransactions")
      .withIndex("employeeId_timestamp", (q: any) => q.eq("employeeId", userId))
      .order("desc")
      .take(100);

    const totalXPEarned = xpTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyXPGained = xpTransactions
      .filter(t => t.timestamp >= monthStart.getTime() && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalSales,
      deliveredSales,
      pendingFinance,
      pendingRegistration,
      pendingDelivery,
      cancelledSales,
      totalRevenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
      monthlySales,
      monthlyDelivered,
      monthlyRevenue,
      salesByType,
      totalXPEarned,
      monthlyXPGained,
      userXP: user.totalXP ?? 0,
      userLevel: user.level ?? 1,
      userRank: user.rank ?? "Rookie",
    };
  },
});

// ─── Manager Dashboard Stats ───────────────────────────────────────────────

export const getManagerDashboard = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const managerRoles = ["super_admin", "regional_director", "regional_manager", "dealer_principal", "branch_manager", "sales_manager", "team_leader"];
    if (!managerRoles.includes(user.role ?? "")) return null;

    // Get reportees (users whose managerId matches this user)
    const reportees = await ctx.db.query("users")
      .withIndex("managerId", (q: any) => q.eq("managerId", userId))
      .collect();

    // If manager is high-level, get broader team
    let teamMembers = reportees;
    if (["super_admin", "regional_director", "regional_manager"].includes(user.role ?? "")) {
      // Get users in same region/dealer
      if (user.region) {
        const regionUsers = await ctx.db.query("users")
          .withIndex("branch", (q: any) => q.eq("branch", user.branch ?? ""))
          .collect();
        teamMembers = regionUsers;
      }
    }

    const teamIds = teamMembers.map(m => m._id);
    const teamSize = teamMembers.length;

    // Team performance
    const teamSales = await Promise.all(
      teamIds.map(async (id) => {
        const sales = await ctx.db.query("sales")
          .withIndex("employeeId", (q: any) => q.eq("employeeId", id))
          .collect();
        return { employeeId: id, sales };
      })
    );

    const totalTeamSales = teamSales.reduce((sum, t) => sum + t.sales.length, 0);
    const totalTeamDeliveries = teamSales.reduce((sum, t) => sum + t.sales.filter(s => s.status === "delivered").length, 0);
    const totalTeamRevenue = teamSales.reduce((sum, t) => sum + t.sales.filter(s => s.status === "delivered").reduce((s, sale) => s + sale.amount, 0), 0);

    // Performance heatmap data
    const teamPerformance = teamMembers.map(m => ({
      id: m._id,
      name: m.name ?? "Unknown",
      role: m.role ?? "",
      totalXP: m.totalXP ?? 0,
      level: m.level ?? 1,
      salesCount: teamSales.find(t => t.employeeId === m._id)?.sales.length ?? 0,
      deliveriesCount: teamSales.find(t => t.employeeId === m._id)?.sales.filter(s => s.status === "delivered").length ?? 0,
    }));

    // Pending approvals
    const pendingRedemptions = await ctx.db.query("rewardRedemptions")
      .withIndex("status", (q: any) => q.eq("status", "pending"))
      .collect();

    const enrichedRedemptions = await Promise.all(
      pendingRedemptions.map(async (r) => {
        const emp = await ctx.db.get(r.employeeId);
        const reward = await ctx.db.get(r.rewardId);
        return { ...r, employee: emp, reward };
      })
    );

    return {
      teamSize,
      totalTeamSales,
      totalTeamDeliveries,
      totalTeamRevenue,
      teamPerformance,
      pendingApprovals: enrichedRedemptions,
    };
  },
});

// ─── Get Sales Funnel ──────────────────────────────────────────────────────

export const getSalesFunnel = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Get all sales accessible based on role
    let sales;
    if (user.role === "super_admin" || user.role === "regional_director") {
      sales = await ctx.db.query("sales").collect();
    } else if (user.region) {
      // Filter by region (simplified - get all and filter)
      const allSales = await ctx.db.query("sales").collect();
      const regionUsers = await ctx.db.query("users")
        .filter((q: any) => q.eq(q.field("region"), user.region))
        .collect();
      const regionUserIds = new Set(regionUsers.map(u => u._id));
      sales = allSales.filter(s => regionUserIds.has(s.employeeId));
    } else {
      sales = await ctx.db.query("sales")
        .withIndex("employeeId", (q: any) => q.eq("employeeId", userId))
        .collect();
    }

    return {
      bookings: sales.filter(s => s.status === "booking").length,
      financePending: sales.filter(s => s.status === "finance_pending").length,
      financeApproved: sales.filter(s => s.status === "finance_approved").length,
      invoiceGenerated: sales.filter(s => s.status === "invoice_generated").length,
      registrationPending: sales.filter(s => s.status === "registration_pending").length,
      delivered: sales.filter(s => s.status === "delivered").length,
      cancelled: sales.filter(s => s.status === "cancelled").length,
      total: sales.length,
    };
  },
});

// ─── Get Event Logs ────────────────────────────────────────────────────────

export const getEventLogs = authQuery({
  args: {
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let events;
    if (args.eventType) {
      events = await ctx.db.query("events")
        .withIndex("eventType", (q: any) => q.eq("eventType", args.eventType))
        .order("desc")
        .take(args.limit ?? 50);
    } else {
      events = await ctx.db.query("events")
        .order("desc")
        .take(args.limit ?? 50);
    }

    const enriched = await Promise.all(
      events.map(async (event) => {
        const emp = await ctx.db.get(event.employeeId);
        return { ...event, employee: emp };
      })
    );

    return enriched;
  },
});

// ─── Get Hierarchy Tree ────────────────────────────────────────────────────

export const getHierarchyTree = authQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    // Build tree structure
    const topLevel = users.filter(u => !u.managerId);
    const buildTree = (parentId: string | undefined): any[] => {
      return users
        .filter(u => u.managerId === parentId)
        .map(u => ({
          id: u._id,
          name: u.name ?? "Unknown",
          role: u.role ?? "",
          email: u.email ?? "",
          totalXP: u.totalXP ?? 0,
          level: u.level ?? 1,
          rank: u.rank ?? "",
          children: buildTree(u._id),
        }));
    };

    return topLevel.map(u => ({
      id: u._id,
      name: u.name ?? "Unknown",
      role: u.role ?? "",
      email: u.email ?? "",
      totalXP: u.totalXP ?? 0,
      level: u.level ?? 1,
      rank: u.rank ?? "",
      children: buildTree(u._id),
    }));
  },
});
