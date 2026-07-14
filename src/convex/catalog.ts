import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getVehicles = query({
  args: {
    category: v.optional(v.string()),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let vehicles;
    
    if (args.category) {
      vehicles = await ctx.db
        .query("vehicles")
        .withIndex("category", (q) => q.eq("category", args.category!))
        .collect();
    } else if (args.isPopular) {
      vehicles = await ctx.db
        .query("vehicles")
        .withIndex("isPopular", (q) => q.eq("isPopular", args.isPopular!))
        .collect();
    } else {
      vehicles = await ctx.db.query("vehicles").collect();
    }
    
    // Fetch thumbnail images for each vehicle
    return Promise.all(
      vehicles.map(async (vehicle) => {
        const variants = await ctx.db
          .query("vehicleVariants")
          .withIndex("vehicleId", (q) => q.eq("vehicleId", vehicle._id))
          .collect();
          
        const images = await ctx.db
          .query("vehicleImages")
          .withIndex("vehicleId", (q) => q.eq("vehicleId", vehicle._id))
          .collect();
          
        return {
          ...vehicle,
          variants,
          images,
        };
      })
    );
  },
});

export const getVehicleDetails = query({
  args: {
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) return null;
    
    const variants = await ctx.db
      .query("vehicleVariants")
      .withIndex("vehicleId", (q) => q.eq("vehicleId", vehicle._id))
      .collect();
      
    const images = await ctx.db
      .query("vehicleImages")
      .withIndex("vehicleId", (q) => q.eq("vehicleId", vehicle._id))
      .collect();
      
    return {
      ...vehicle,
      variants,
      images,
    };
  },
});
