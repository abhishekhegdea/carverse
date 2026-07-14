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

export const seedVehicles = mutation({
  args: {},
  handler: async (ctx) => {
    const existingVehicles = await ctx.db.query("vehicles").collect();
    if (existingVehicles.length > 0) {
      // Clear existing vehicles to allow re-seeding
      for (const v of existingVehicles) {
        await ctx.db.delete(v._id);
      }
    }

    const vehiclesToSeed = [
      {
        brand: "Maruti Suzuki",
        model: "Grand Vitara",
        category: "suv",
        startingPrice: 1099000,
        isPopular: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1635334237145-c1e956e1841a?q=80&w=2070&auto=format&fit=crop",
        description: "The Grand Vitara brings the legendary Suzuki SUV lineage with an imposing design, intelligent hybrid technology, and panoramic sunroof.",
      },
      {
        brand: "Hyundai",
        model: "Creta",
        category: "suv",
        startingPrice: 1100000,
        isPopular: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?q=80&w=2070&auto=format&fit=crop",
        description: "The Ultimate SUV. With its breath-taking beautiful and edgy design, the Hyundai CRETA has been the best-selling SUV in its class.",
      },
      {
        brand: "Mahindra",
        model: "XUV700",
        category: "suv",
        startingPrice: 1399000,
        isPopular: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1595568326757-0744fb86eef9?q=80&w=2070&auto=format&fit=crop",
        description: "Unmissable presence. Sci-fi technology. Spirited performance. World-class safety. The XUV700 is engineered to give you a rush.",
      },
      {
        brand: "Honda",
        model: "City",
        category: "sedan",
        startingPrice: 1182000,
        isPopular: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop",
        description: "A supreme expression of intelligence, the Honda City has been the favorite sedan for generations.",
      },
      {
        brand: "Hyundai",
        model: "Verna",
        category: "sedan",
        startingPrice: 1100000,
        isPopular: false,
        thumbnailUrl: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=2070&auto=format&fit=crop",
        description: "Ferocious by design. The all-new Hyundai Verna brings futuristic styling and thrilling performance.",
      },
      {
        brand: "Tata",
        model: "Nexon EV",
        category: "electric",
        startingPrice: 1474000,
        isPopular: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop",
        description: "India's bestselling electric SUV. #Dark to the core, packed with high voltage performance and next-gen tech.",
      },
      {
        brand: "Tesla",
        model: "Model 3",
        category: "electric",
        startingPrice: 4500000,
        isPopular: false,
        thumbnailUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
        description: "Model 3 is built for safety and performance, with dual motor AWD, quick acceleration, and an all-glass roof.",
      },
      {
        brand: "Mercedes-Benz",
        model: "E-Class",
        category: "luxury",
        startingPrice: 7600000,
        isPopular: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=2070&auto=format&fit=crop",
        description: "The E-Class Sedan is the embodiment of modern style and refined sportiness, paired with luxurious comfort.",
      },
      {
        brand: "BMW",
        model: "5 Series",
        category: "luxury",
        startingPrice: 7450000,
        isPopular: false,
        thumbnailUrl: "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?q=80&w=2070&auto=format&fit=crop",
        description: "Masterpiece of intelligence. The BMW 5 Series stands for absolute supremacy, unmatched luxury and exceptional driving dynamics.",
      }
    ];

    for (const v of vehiclesToSeed) {
      await ctx.db.insert("vehicles", {
        ...v,
        createdAt: Date.now(),
      });
    }
    
    return { success: true, count: vehiclesToSeed.length };
  }
});
