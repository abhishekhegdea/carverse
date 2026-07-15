import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { calculateRuleBasedValuation } from "./exchangeEngine";

// 1. Submit and Evaluate (All in one deterministic mutation)
export const submitAndEvaluateExchange = mutation({
  args: {
    customerName: v.string(),
    phone: v.string(),
    brand: v.string(),
    model: v.string(),
    variant: v.string(),
    manufacturingYear: v.number(),
    registrationYear: v.number(),
    fuelType: v.string(),
    transmission: v.string(),
    kilometers: v.number(),
    ownerCount: v.number(),
    insuranceValidity: v.string(),
    accidentHistory: v.string(),
    serviceHistory: v.string(),
    rcAvailable: v.boolean(),
    loanPending: v.boolean(),
    city: v.string(),
    vehicleCondition: v.string(),
    tyreCondition: v.string(),
    batteryCondition: v.optional(v.string()),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check or Create Customer
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("phone", (q) => q.eq("phone", args.phone))
      .first();

    let customerId = existingCustomer?._id;
    if (!customerId) {
      customerId = await ctx.db.insert("customers", {
        name: args.customerName,
        phone: args.phone,
        createdAt: Date.now(),
      });
    }

    // 2. Determine Base Price from Master Data
    // We will attempt to find the exact match, otherwise use a fallback mock based on brand
    let basePrice = 500000; // default 5 Lakh fallback
    
    const masterVehicle = await ctx.db
      .query("vehicleMaster")
      .withIndex("brand_model", (q) => q.eq("brand", args.brand).eq("model", args.model))
      .filter((q) => q.eq(q.field("variant"), args.variant))
      .first();

    if (masterVehicle) {
      basePrice = masterVehicle.currentAvgMarketPrice || masterVehicle.launchPrice;
    } else {
      // Mocked logic for fallback if vehicle_master isn't seeded yet
      if (args.brand.toLowerCase() === "maruti") basePrice = 600000;
      else if (args.brand.toLowerCase() === "hyundai") basePrice = 800000;
      else if (args.brand.toLowerCase() === "honda") basePrice = 1000000;
      else if (args.brand.toLowerCase() === "toyota") basePrice = 1500000;
      else if (args.brand.toLowerCase() === "bmw") basePrice = 4000000;
    }

    // 3. Rule-Based Mathematical Evaluation
    const valuation = calculateRuleBasedValuation(
      basePrice,
      args.manufacturingYear,
      args.kilometers,
      args.ownerCount,
      args.insuranceValidity,
      args.serviceHistory,
      args.accidentHistory,
      args.vehicleCondition,
      args.tyreCondition
    );

    // 4. Save to Exchange Requests
    const exchangeId = await ctx.db.insert("exchangeRequests", {
      customerId,
      customerName: args.customerName,
      phone: args.phone,
      brand: args.brand,
      model: args.model,
      variant: args.variant,
      manufacturingYear: args.manufacturingYear,
      registrationYear: args.registrationYear,
      fuelType: args.fuelType,
      transmission: args.transmission,
      kilometers: args.kilometers,
      ownerCount: args.ownerCount,
      insuranceValidity: args.insuranceValidity,
      accidentHistory: args.accidentHistory,
      serviceHistory: args.serviceHistory,
      rcAvailable: args.rcAvailable,
      loanPending: args.loanPending,
      city: args.city,
      vehicleCondition: args.vehicleCondition,
      tyreCondition: args.tyreCondition,
      batteryCondition: args.batteryCondition,
      
      basePrice: valuation.basePrice,
      estimatedValue: valuation.estimatedValue,
      priceRangeMin: valuation.priceRangeMin,
      priceRangeMax: valuation.priceRangeMax,
      
      status: "pending",
      images: args.images,
      createdAt: Date.now(),
    });

    // 5. Save Valuation History Breakdown
    await ctx.db.insert("valuationHistory", {
      exchangeRequestId: exchangeId,
      breakdown: valuation.breakdown,
      timestamp: Date.now(),
    });

    return {
      exchangeId,
      valuation
    };
  },
});

export const getExchangeRequests = query({
  args: {},
  handler: async (ctx) => {
    // Return all requests sorted by latest
    const requests = await ctx.db.query("exchangeRequests").order("desc").collect();
    return requests;
  },
});

export const getValuationHistory = query({
  args: { exchangeId: v.id("exchangeRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.query("valuationHistory")
      .withIndex("exchangeRequestId", q => q.eq("exchangeRequestId", args.exchangeId))
      .first();
  },
});

export const submitInspectionReport = mutation({
  args: {
    exchangeRequestId: v.id("exchangeRequests"),
    executiveId: v.id("users"),
    finalPrice: v.number(),
    reasonForDifference: v.string(),
    inspectionNotes: v.string(),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.exchangeRequestId, {
      status: "inspected",
      finalValue: args.finalPrice,
    });

    await ctx.db.insert("inspectionReports", {
      exchangeRequestId: args.exchangeRequestId,
      executiveId: args.executiveId,
      finalPrice: args.finalPrice,
      reasonForDifference: args.reasonForDifference,
      inspectionNotes: args.inspectionNotes,
      images: args.images,
      inspectionDate: Date.now(),
    });
    
    return true;
  },
});

export const transferToSales = mutation({
  args: {
    exchangeRequestId: v.id("exchangeRequests"),
    executiveId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.exchangeRequestId);
    if (!request || !request.customerId) throw new Error("Request not found or no customer linked.");

    // Update status in exchange
    await ctx.db.patch(args.exchangeRequestId, { status: "approved" });

    // Transfer to CRM Pipeline as a Sales Enquiry
    const saleId = await ctx.db.insert("sales", {
      employeeId: args.executiveId,
      customerId: request.customerId,
      customerName: request.customerName,
      carType: "passenger",
      carModel: request.model,
      amount: request.finalValue || request.estimatedValue,
      status: "enquiry",
      hasInsurance: false,
      hasAccessories: false,
      hasExchange: true,
      bookingDate: Date.now(),
      createdAt: Date.now(),
    });

    return saleId;
  },
});
