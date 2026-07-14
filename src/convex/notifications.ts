import { authQuery, authMutation } from "./customAuth";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./authHelper";

// ─── Get My Notifications ──────────────────────────────────────────────────

export const getMyNotifications = authQuery({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { notifications: [], unreadCount: 0 };

    let notifications;
    if (args.unreadOnly) {
      notifications = await ctx.db.query("notifications")
        .withIndex("employeeId_read", (q: any) => q.eq("employeeId", userId).eq("read", false))
        .order("desc")
        .take(args.limit ?? 20);
    } else {
      notifications = await ctx.db.query("notifications")
        .withIndex("employeeId", (q: any) => q.eq("employeeId", userId))
        .order("desc")
        .take(args.limit ?? 50);
    }

    const unreadNotifications = args.unreadOnly
      ? notifications
      : await ctx.db.query("notifications")
          .withIndex("employeeId_read", (q: any) => q.eq("employeeId", userId).eq("read", false))
          .collect();

    return {
      notifications,
      unreadCount: unreadNotifications.length,
    };
  },
});

// ─── Mark Notification as Read ─────────────────────────────────────────────

export const markAsRead = authMutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// ─── Mark All as Read ──────────────────────────────────────────────────────

export const markAllAsRead = authMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const unread = await ctx.db.query("notifications")
      .withIndex("employeeId_read", (q: any) => q.eq("employeeId", userId).eq("read", false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

// ─── Get Activity Feed ─────────────────────────────────────────────────────

export const getActivityFeed = authQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db.query("activities")
      .order("desc")
      .take(args.limit ?? 30);

    const enriched = await Promise.all(
      activities.map(async (activity) => {
        const emp = await ctx.db.get(activity.employeeId);
        return { ...activity, employee: emp };
      })
    );

    return enriched;
  },
});

// ─── Like Activity ─────────────────────────────────────────────────────────

export const likeActivity = authMutation({
  args: {
    activityId: v.id("activities"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    const likes = activity.likes ?? [];
    const userIndex = likes.indexOf(userId);

    let updatedLikes: typeof likes;
    if (userIndex >= 0) {
      updatedLikes = [...likes.slice(0, userIndex), ...likes.slice(userIndex + 1)];
    } else {
      updatedLikes = [...likes, userId];
    }

    await ctx.db.patch(args.activityId, { likes: updatedLikes });
    return { liked: userIndex < 0, likesCount: updatedLikes.length };
  },
});

// ─── Comment on Activity ───────────────────────────────────────────────────

export const commentOnActivity = authMutation({
  args: {
    activityId: v.id("activities"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    const comment = {
      userId,
      text: args.text,
      createdAt: Date.now(),
    };

    await ctx.db.patch(args.activityId, {
      comments: [...(activity.comments ?? []), comment],
    });

    return comment;
  },
});

// ─── Post Activity ─────────────────────────────────────────────────────────

export const postActivity = authMutation({
  args: {
    type: v.union(
      v.literal("xp_milestone"),
      v.literal("badge_earned"),
      v.literal("level_up"),
      v.literal("achievement"),
      v.literal("sale_closed"),
      v.literal("birthday"),
      v.literal("promotion"),
      v.literal("announcement"),
      v.literal("appreciation"),
    ),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("activities", {
      employeeId: userId,
      type: args.type,
      message: args.message,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    });
  },
});
