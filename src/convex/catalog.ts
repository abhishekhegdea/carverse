import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getVehicles = query({
  args: {
    category: v.optional(v.string()),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("vehicles");
    
    if (args.category) {
      q = q.withIndex("category", (q) => q.eq("category", args.category!));
    } else if (args.isPopular) {
      q = q.withIndex("isPopular", (q) => q.eq("isPopular", args.isPopular!));
    }
    
    const vehicles = await q.collect();
    
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
