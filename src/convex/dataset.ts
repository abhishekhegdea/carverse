import { authQuery, authMutation } from "./customAuth";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Mutations for importing data ──────────────────────────────────────────

export const importLocations = authMutation({
  args: {
    locations: v.array(
      v.object({
        locationId: v.string(),
        locationGroup: v.string(),
        bookingHub: v.string(),
        clusterId: v.string(),
        locationCode: v.string(),
        locationName: v.string(),
        locationDms: v.optional(v.string()),
        outletType: v.optional(v.string()),
        outletFunction: v.optional(v.string()),
        locationStatus: v.string(),
        locationAddedDatetime: v.string(),
        latlng: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const location of args.locations) {
      // Check if location already exists to avoid duplicates during multiple runs
      const existing = await ctx.db
        .query("locations")
        .withIndex("locationCode", (q) => q.eq("locationCode", location.locationCode))
        .first();
      
      if (!existing) {
        await ctx.db.insert("locations", location);
      }
    }
    return { success: true, imported: args.locations.length };
  },
});

export const importEmployees = authMutation({
  args: {
    employees: v.array(
      v.object({
        groupId: v.string(),
        employeeId: v.string(),
        name: v.string(),
        mobile: v.optional(v.string()),
        locCode: v.string(),
        reportingLocation: v.optional(v.string()),
        designation: v.optional(v.string()),
        manager: v.optional(v.string()),
        dseCode: v.optional(v.string()),
        department: v.string(),
        roleRights: v.optional(v.string()),
        status: v.optional(v.string()),
        createdDate: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const employee of args.employees) {
      const existing = await ctx.db
        .query("employees")
        .withIndex("employeeId", (q) => q.eq("employeeId", employee.employeeId))
        .first();

      if (!existing) {
        await ctx.db.insert("employees", employee);
      }
    }
    return { success: true, imported: args.employees.length };
  },
});

export const importEventLogs = authMutation({
  args: {
    eventLogs: v.array(
      v.object({
        logId: v.string(),
        groupId: v.optional(v.string()),
        stage: v.optional(v.string()),
        categories: v.optional(v.string()),
        department: v.string(),
        username: v.string(),
        userId: v.string(),
        enquiryNo: v.string(),
        locationCode: v.string(),
        message: v.optional(v.string()),
        actionCode: v.string(),
        source: v.optional(v.string()),
        createdDate: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // For large logs, we might just insert them directly
    // If you want to prevent duplicates, you can check by logId, but that requires an index.
    // For now we just insert since the import script will handle batching.
    for (const log of args.eventLogs) {
      await ctx.db.insert("eventLogs", log);
    }
    return { success: true, imported: args.eventLogs.length };
  },
});

// ─── Queries ───────────────────────────────────────────────────────────────

export const getEmployeesByLocation = authQuery({
  args: { locationCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("employees")
      .withIndex("locCode", (q) => q.eq("locCode", args.locationCode))
      .collect();
  },
});

export const getEventLogsByEnquiry = authQuery({
  args: { enquiryNo: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventLogs")
      .withIndex("enquiryNo", (q) => q.eq("enquiryNo", args.enquiryNo))
      .collect();
  },
});
