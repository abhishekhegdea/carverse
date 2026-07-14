import { authQuery, authMutation } from "./customAuth";
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "./authHelper";

// ─── Compute Leaderboard ───────────────────────────────────────────────────

export const computeLeaderboard = internalMutation({
  args: {
    periodType: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let periodStart: number;
    let periodEnd: number;

    switch (args.periodType) {
      case "daily":
        periodStart = today.getTime();
        periodEnd = periodStart + 24 * 60 * 60 * 1000;
        break;
      case "weekly": {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        periodStart = weekStart.getTime();
        periodEnd = periodStart + 7 * 24 * 60 * 60 * 1000;
        break;
      }
      case "monthly":
        periodStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
        periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime();
        break;
      case "quarterly": {
        const quarter = Math.floor(today.getMonth() / 3);
        periodStart = new Date(today.getFullYear(), quarter * 3, 1).getTime();
        periodEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 1).getTime();
        break;
      }
      case "yearly":
        periodStart = new Date(today.getFullYear(), 0, 1).getTime();
        periodEnd = new Date(today.getFullYear() + 1, 0, 1).getTime();
        break;
    }

    // Get all XP transactions in this period
    const transactions = await ctx.db.query("xpTransactions")
      .filter((q: any) =>
        q.and(
          q.gte(q.field("timestamp"), periodStart),
          q.lt(q.field("timestamp"), periodEnd),
        )
      )
      .collect();

    // Group by employee and sum XP
    const xpByEmployee = new Map<string, number>();
    const salesByEmployee = new Map<string, number>();
    const deliveriesByEmployee = new Map<string, number>();

    for (const t of transactions) {
      const empId = t.employeeId.toString();
      xpByEmployee.set(empId, (xpByEmployee.get(empId) ?? 0) + t.amount);
    }

    // Get sales data
    const sales = await ctx.db.query("sales")
      .filter((q: any) =>
        q.and(
          q.gte(q.field("bookingDate"), periodStart),
          q.lt(q.field("bookingDate"), periodEnd),
        )
      )
      .collect();

    for (const s of sales) {
      const empId = s.employeeId.toString();
      salesByEmployee.set(empId, (salesByEmployee.get(empId) ?? 0) + 1);
      if (s.status === "delivered") {
        deliveriesByEmployee.set(empId, (deliveriesByEmployee.get(empId) ?? 0) + 1);
      }
    }

    // Remove old entries for this period+scope
    const scopes = ["individual", "branch", "dealer", "region", "state", "country", "department"];

    for (const scope of scopes) {
      const oldEntries = await ctx.db.query("leaderboard")
        .withIndex("periodType_scope", (q: any) =>
          q.eq("periodType", args.periodType).eq("scope", scope)
        )
        .filter((q: any) => q.eq(q.field("periodStart"), periodStart))
        .collect();

      for (const old of oldEntries) {
        await ctx.db.delete(old._id);
      }

      // Compute ranking
      let rankedEntries: { entityId: string; totalXP: number; salesCount: number; deliveriesCount: number; branch?: string; dealer?: string; region?: string; department?: string }[] = [];

      if (scope === "individual") {
        // Get all users
        const users = await ctx.db.query("users").collect();
        rankedEntries = users
          .map(u => ({
            entityId: u._id.toString(),
            totalXP: xpByEmployee.get(u._id.toString()) ?? 0,
            salesCount: salesByEmployee.get(u._id.toString()) ?? 0,
            deliveriesCount: deliveriesByEmployee.get(u._id.toString()) ?? 0,
          }))
          .filter(e => e.totalXP > 0 || e.salesCount > 0);
      } else {
        // Group by entity (branch, dealer, region, etc.)
        const users = await ctx.db.query("users").collect();
        const groupMap = new Map<string, { totalXP: number; salesCount: number; deliveriesCount: number }>();

        for (const u of users) {
          let key = "";
          switch (scope) {
            case "branch": key = u.branch ?? "Unknown"; break;
            case "dealer": key = u.dealer ?? "Unknown"; break;
            case "region": key = u.region ?? "Unknown"; break;
            case "state": key = u.state ?? "Unknown"; break;
            case "country": key = "India"; break;
            case "department": key = u.department ?? "Unknown"; break;
          }

          if (!key) continue;
          const existing = groupMap.get(key) ?? { totalXP: 0, salesCount: 0, deliveriesCount: 0 };
          existing.totalXP += xpByEmployee.get(u._id.toString()) ?? 0;
          existing.salesCount += salesByEmployee.get(u._id.toString()) ?? 0;
          existing.deliveriesCount += deliveriesByEmployee.get(u._id.toString()) ?? 0;
          groupMap.set(key, existing);
        }

        const getField = (key: string) => {
          switch (scope) {
            case "branch": return { branch: key };
            case "dealer": return { dealer: key };
            case "region": return { region: key };
            case "state": return { state: key };
            case "country": return { country: key };
            case "department": return { department: key };
            default: return {};
          }
        };

        rankedEntries = Array.from(groupMap.entries())
          .map(([key, data]) => ({
            entityId: key,
            totalXP: data.totalXP,
            salesCount: data.salesCount,
            deliveriesCount: data.deliveriesCount,
            ...getField(key),
          }))
          .filter(e => e.totalXP > 0 || e.salesCount > 0);
      }

      // Sort by XP descending for ranking
      rankedEntries.sort((a, b) => b.totalXP - a.totalXP);

      // Insert new entries
      for (let i = 0; i < rankedEntries.length; i++) {
        const entry = rankedEntries[i];
        const insertData: any = {
          periodType: args.periodType,
          scope,
          periodStart,
          periodEnd,
          totalXP: entry.totalXP,
          rank: i + 1,
          salesCount: entry.salesCount,
          deliveriesCount: entry.deliveriesCount,
        };

        if (scope === "individual") {
          insertData.employeeId = entry.entityId as any;
        } else {
          insertData.branch = (entry as any).branch;
          insertData.dealer = (entry as any).dealer;
          insertData.region = (entry as any).region;
          insertData.department = (entry as any).department;
        }

        await ctx.db.insert("leaderboard", insertData);
      }
    }
  },
});

// ─── Get Top Ranked Users ─────────────────────────────────────────────────

export const getTopRanked = authQuery({
  args: {
    periodType: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodType = args.periodType ?? "monthly";

    let periodStart: number;
    switch (periodType) {
      case "daily": periodStart = today.getTime(); break;
      case "weekly": {
        const ws = new Date(today);
        ws.setDate(ws.getDate() - ws.getDay());
        periodStart = ws.getTime();
        break;
      }
      case "monthly": periodStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime(); break;
      case "quarterly": {
        const q = Math.floor(today.getMonth() / 3);
        periodStart = new Date(today.getFullYear(), q * 3, 1).getTime();
        break;
      }
      case "yearly": periodStart = new Date(today.getFullYear(), 0, 1).getTime(); break;
    }

    const entries = await ctx.db.query("leaderboard")
      .withIndex("periodType_scope", (q: any) => q.eq("periodType", periodType).eq("scope", "individual"))
      .filter((q: any) => q.gte(q.field("periodStart"), periodStart))
      .order("asc")
      .take(args.limit ?? 20);

    const enriched = await Promise.all(
      entries.map(async (entry) => {
        if (entry.employeeId) {
          const emp = await ctx.db.get(entry.employeeId);
          return { ...entry, employee: emp };
        }
        return entry;
      })
    );

    return enriched;
  },
});

// ─── Get My Rank ───────────────────────────────────────────────────────────

export const getMyRank = authQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const periods = ["daily", "weekly", "monthly"] as const;
    const ranks: Record<string, { rank: number; totalXP: number; employeeId: string } | null> = {};

    for (const period of periods) {
      let ps: number;
      switch (period) {
        case "daily": ps = today.getTime(); break;
        case "weekly": { const ws = new Date(today); ws.setDate(ws.getDate() - ws.getDay()); ps = ws.getTime(); break; }
        case "monthly": ps = new Date(today.getFullYear(), today.getMonth(), 1).getTime(); break;
      }

      const entry = await ctx.db.query("leaderboard")
        .withIndex("periodType_scope", (q: any) => q.eq("periodType", period).eq("scope", "individual"))
        .filter((q: any) =>
          q.and(
            q.gte(q.field("periodStart"), ps),
            q.eq(q.field("employeeId"), userId),
          )
        )
        .first();

      ranks[period] = entry ? { rank: entry.rank, totalXP: entry.totalXP, employeeId: entry.employeeId!.toString() } : null;
    }

    return ranks;
  },
});

// ─── Get Manager Leaderboard ───────────────────────────────────────────────

export const getManagerLeaderboard = authQuery({
  args: {
    periodType: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodType = args.periodType ?? "monthly";

    let periodStart: number;
    switch (periodType) {
      case "daily": periodStart = today.getTime(); break;
      case "weekly": {
        const ws = new Date(today);
        ws.setDate(ws.getDate() - ws.getDay());
        periodStart = ws.getTime();
        break;
      }
      case "monthly": periodStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime(); break;
      case "quarterly": {
        const q = Math.floor(today.getMonth() / 3);
        periodStart = new Date(today.getFullYear(), q * 3, 1).getTime();
        break;
      }
      case "yearly": periodStart = new Date(today.getFullYear(), 0, 1).getTime(); break;
    }

    const entries = await ctx.db.query("leaderboard")
      .withIndex("periodType_scope", (q: any) => q.eq("periodType", periodType).eq("scope", "individual"))
      .filter((q: any) => q.gte(q.field("periodStart"), periodStart))
      .order("asc")
      .collect();

    // Filter to only include manager roles
    const managerRoles = ["regional_director", "regional_manager", "dealer_principal", "branch_manager", "sales_manager", "team_leader"];
    
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        if (entry.employeeId) {
          const emp = await ctx.db.get(entry.employeeId);
          return { ...entry, employee: emp };
        }
        return entry;
      })
    );

    const managersOnly = enriched.filter(e => e.employee && e.employee.role && managerRoles.includes(e.employee.role));
    
    // Sort by XP descending just to be safe, though they should be somewhat sorted
    managersOnly.sort((a, b) => b.totalXP - a.totalXP);
    
    // Re-rank them amongst themselves
    managersOnly.forEach((m, idx) => m.rank = idx + 1);

    return managersOnly.slice(0, args.limit ?? 10);
  },
});

// ─── Get Manager Performance Details (Team Drilldown) ──────────────────────

export const getManagerPerformanceDetails = authQuery({
  args: {
    managerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const targetManagerId = args.managerId ?? userId;
    const manager = await ctx.db.get(targetManagerId);
    if (!manager) return null;

    // Get direct reportees
    const reportees = await ctx.db.query("users")
      .withIndex("managerId", (q) => q.eq("managerId", targetManagerId))
      .collect();

    // Get stats for each reportee
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime(); // Monthly stats

    const teamStats = await Promise.all(reportees.map(async (emp) => {
      // Find their monthly XP from leaderboard
      const lbEntry = await ctx.db.query("leaderboard")
        .withIndex("periodType_scope", (q: any) => q.eq("periodType", "monthly").eq("scope", "individual"))
        .filter((q: any) => q.and(
          q.gte(q.field("periodStart"), periodStart),
          q.eq(q.field("employeeId"), emp._id)
        ))
        .first();

      const totalXP = lbEntry?.totalXP ?? emp.totalXP ?? 0;
      const salesCount = lbEntry?.salesCount ?? 0;
      const deliveriesCount = lbEntry?.deliveriesCount ?? 0;

      return {
        employee: emp,
        totalXP,
        salesCount,
        deliveriesCount
      };
    }));

    // Sort team by contribution
    teamStats.sort((a, b) => b.totalXP - a.totalXP);

    const totalTeamXP = teamStats.reduce((sum, member) => sum + member.totalXP, 0);
    const totalTeamSales = teamStats.reduce((sum, member) => sum + member.salesCount, 0);

    return {
      manager,
      totalTeamXP,
      totalTeamSales,
      teamStats
    };
  }
});
