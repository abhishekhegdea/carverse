import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery, authMutation } from "./customAuth";
import { getCurrentUser } from "./users";

export const getActiveRaces = authQuery({
  args: {},
  handler: async (ctx) => {
    const races = await ctx.db
      .query("branchRaces")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();
    return races;
  },
});

export const getCompletedRaces = authQuery({
  args: {},
  handler: async (ctx) => {
    const races = await ctx.db
      .query("branchRaces")
      .withIndex("status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(5);
    return races;
  },
});

export const simulateSaleForRace = authMutation({
  args: {
    raceId: v.id("branchRaces"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not found");
    if (!user.branch) throw new Error("User does not belong to a branch.");

    const race = await ctx.db.get(args.raceId);
    if (!race || race.status !== "active") {
      throw new Error("Race is not active.");
    }

    // Find the branch in progress
    const progress = [...race.progress];
    const branchIndex = progress.findIndex((p) => p.branch === user.branch);

    if (branchIndex >= 0) {
      progress[branchIndex].sales += 1;
    } else {
      progress.push({ branch: user.branch, sales: 1 });
    }

    // Check if the branch reached the target
    const currentSales = branchIndex >= 0 ? progress[branchIndex].sales : 1;
    let newStatus: string = race.status;
    let winnerBranch = race.winnerBranch;
    let completedAt = race.completedAt;

    if (currentSales >= race.targetSales) {
      newStatus = "completed";
      winnerBranch = user.branch;
      completedAt = Date.now();
    }

    await ctx.db.patch(args.raceId, {
      progress,
      status: newStatus as any,
      winnerBranch,
      completedAt,
    });

    return { success: true, finished: newStatus === "completed" };
  },
});

export async function recordBranchSale(ctx: any, branchName: string) {
  if (!branchName) return;

  const activeRaces = await ctx.db
    .query("branchRaces")
    .withIndex("status", (q: any) => q.eq("status", "active"))
    .collect();

  for (const race of activeRaces) {
    const progress = [...race.progress];
    const branchIndex = progress.findIndex((p: any) => p.branch === branchName);

    if (branchIndex >= 0) {
      progress[branchIndex].sales += 1;
    } else {
      progress.push({ branch: branchName, sales: 1 });
    }

    const currentSales = branchIndex >= 0 ? progress[branchIndex].sales : 1;
    let newStatus: string = race.status;
    let winnerBranch = race.winnerBranch;
    let completedAt = race.completedAt;

    if (currentSales >= race.targetSales) {
      newStatus = "completed";
      winnerBranch = branchName;
      completedAt = Date.now();
    }

    await ctx.db.patch(race._id, {
      progress,
      status: newStatus as any,
      winnerBranch,
      completedAt,
    });
  }
}

export const initializeRace = authMutation({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db.query("branchRaces").withIndex("status", (q) => q.eq("status", "active")).first();
    if (active) return; // Already has an active race

    await ctx.db.insert("branchRaces", {
      title: "The Great Q3 Sales Dash",
      description: "First branch to hit 50 vehicle deliveries wins an all-expenses-paid trip to Goa!",
      targetSales: 50,
      reward: "Trip to Goa",
      status: "active",
      progress: [
        { branch: "Mumbai Central", sales: 42 },
        { branch: "Delhi South", sales: 38 },
        { branch: "Bangalore East", sales: 45 },
        { branch: "Chennai North", sales: 25 }
      ],
      startedAt: Date.now(),
    });
  },
});
