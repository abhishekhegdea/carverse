import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const SPIN_WHEEL_COST = 500;

const WHEEL_REWARDS = [
  { id: "double_xp", label: "Double XP (24h)", type: "buff", weight: 5 },
  { id: "xp_shield", label: "XP Shield", type: "buff", weight: 15 },
  { id: "movie_coupon", label: "Movie Coupon", type: "voucher", weight: 2 },
  { id: "amazon_coupon", label: "Amazon Coupon", type: "voucher", weight: 1 },
  { id: "fuel_voucher", label: "Fuel Voucher", type: "voucher", weight: 10 },
  { id: "coffee_voucher", label: "Coffee Voucher", type: "voucher", weight: 30 },
  { id: "leave_pass", label: "Half-Day Leave Pass", type: "special", weight: 1 },
  { id: "mystery_chest", label: "Mystery Chest", type: "coins", weight: 10 },
  { id: "jackpot", label: "JACKPOT 10,000 Coins", type: "coins", weight: 0.1 },
  { id: "nothing", label: "Better Luck Next Time", type: "none", weight: 25 },
];

export async function awardCoins(
  ctx: any,
  args: {
    employeeId: Id<"users">,
    amount: number,
    reason: string,
  }
) {
  const employee = await ctx.db.get(args.employeeId);
  if (!employee) return;

  const newCoins = (employee.coins || 0) + args.amount;
  await ctx.db.patch(args.employeeId, { coins: newCoins });

  if (args.amount > 0) {
    await ctx.db.insert("notifications", {
      employeeId: args.employeeId,
      type: "system",
      title: "Coins Earned!",
      message: `You received 🪙 ${args.amount} for: ${args.reason}`,
      read: false,
      createdAt: Date.now(),
    });
  }
}

export const spinWheel = mutation({
  args: {
    employeeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("User not found");

    if ((employee.coins || 0) < SPIN_WHEEL_COST) {
      throw new Error(`Insufficient coins. You need 🪙 ${SPIN_WHEEL_COST} to spin.`);
    }

    const newCoins = employee.coins! - SPIN_WHEEL_COST;
    await ctx.db.patch(args.employeeId, { coins: newCoins });

    const totalWeight = WHEEL_REWARDS.reduce((sum, r) => sum + r.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let selectedReward = WHEEL_REWARDS[WHEEL_REWARDS.length - 1]; 

    for (const reward of WHEEL_REWARDS) {
      randomVal -= reward.weight;
      if (randomVal <= 0) {
        selectedReward = reward;
        break;
      }
    }

    let multiplier = 1;
    if (selectedReward.id === "jackpot") {
      await ctx.db.patch(args.employeeId, { coins: newCoins + 10000 });
    } else if (selectedReward.id === "mystery_chest") {
      const mysteryCoins = Math.floor(Math.random() * 1900) + 100;
      await ctx.db.patch(args.employeeId, { coins: newCoins + mysteryCoins });
      multiplier = mysteryCoins;
    } else if (selectedReward.id === "xp_shield") {
      const newShields = (employee.freezeCards || 0) + 1;
      await ctx.db.patch(args.employeeId, { freezeCards: Math.min(newShields, 3) });
    }

    await ctx.db.insert("spinWheelSpins", {
      employeeId: args.employeeId,
      xpCost: SPIN_WHEEL_COST,
      reward: selectedReward.label,
      rewardType: selectedReward.type,
      multiplier: multiplier,
      spunAt: Date.now(),
    });

    if (selectedReward.type !== "none") {
       await ctx.db.insert("activities", {
        employeeId: args.employeeId,
        type: "achievement",
        message: `${employee.name} spun the wheel and won: ${selectedReward.label}! 🎰`,
        likes: [],
        comments: [],
        createdAt: Date.now(),
      });
    }

    return selectedReward;
  },
});
