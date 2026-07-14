import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// ─── Role Constants ────────────────────────────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  REGIONAL_DIRECTOR: "regional_director",
  REGIONAL_MANAGER: "regional_manager",
  DEALER_PRINCIPAL: "dealer_principal",
  BRANCH_MANAGER: "branch_manager",
  SALES_MANAGER: "sales_manager",
  TEAM_LEADER: "team_leader",
  SALES_EXECUTIVE: "sales_executive",
  FINANCE_EXECUTIVE: "finance_executive",
  INSURANCE_EXECUTIVE: "insurance_executive",
  SERVICE_ADVISOR: "service_advisor",
  CUSTOMER: "customer",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.SUPER_ADMIN),
  v.literal(ROLES.REGIONAL_DIRECTOR),
  v.literal(ROLES.REGIONAL_MANAGER),
  v.literal(ROLES.DEALER_PRINCIPAL),
  v.literal(ROLES.BRANCH_MANAGER),
  v.literal(ROLES.SALES_MANAGER),
  v.literal(ROLES.TEAM_LEADER),
  v.literal(ROLES.SALES_EXECUTIVE),
  v.literal(ROLES.FINANCE_EXECUTIVE),
  v.literal(ROLES.INSURANCE_EXECUTIVE),
  v.literal(ROLES.SERVICE_ADVISOR),
  v.literal(ROLES.CUSTOMER),
);
export type Role = Infer<typeof roleValidator>;

// ─── XP Rules ──────────────────────────────────────────────────────────────

export const XP_EVENTS = {
  BOOKING_CREATED: { xp: 50, label: "Booking Created" },
  BOOKING_CONFIRMED: { xp: 80, label: "Booking Confirmed" },
  FINANCE_APPROVED: { xp: 100, label: "Finance Approved" },
  INVOICE_GENERATED: { xp: 120, label: "Invoice Generated" },
  VEHICLE_DELIVERED: { xp: 250, label: "Vehicle Delivered" },
  REGISTRATION_COMPLETED: { xp: 50, label: "Registration Completed" },
  INSURANCE_SOLD: { xp: 60, label: "Insurance Sold" },
  ACCESSORIES_SOLD: { xp: 40, label: "Accessories Sold" },
  EXCHANGE_VEHICLE: { xp: 70, label: "Exchange Vehicle" },
  TEST_DRIVE: { xp: 20, label: "Test Drive" },
  CUSTOMER_FEEDBACK_5_STAR: { xp: 100, label: "Customer Feedback 5★" },
  BOOKING_CANCELLED: { xp: -40, label: "Booking Cancelled" },
  LATE_DELIVERY: { xp: -60, label: "Late Delivery" },
  FINANCE_REJECTED: { xp: -30, label: "Finance Rejected" },
  REPEATED_DISCOUNT_ESCALATION: { xp: -20, label: "Repeated Discount Escalation" },
  PENDING_DOCUMENTS: { xp: -10, label: "Pending Documents" },
  LOGIN: { xp: 5, label: "Daily Login" },
} as const;

export type XPEventType = keyof typeof XP_EVENTS;

// ─── Levels ────────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, title: "Rookie", minXP: 0, maxXP: 500 },
  { level: 2, title: "Driver", minXP: 500, maxXP: 1500 },
  { level: 3, title: "Sales Rider", minXP: 1500, maxXP: 3500 },
  { level: 4, title: "Turbo Seller", minXP: 3500, maxXP: 7000 },
  { level: 5, title: "Elite Dealer", minXP: 7000, maxXP: 12000 },
  { level: 6, title: "Champion", minXP: 12000, maxXP: 20000 },
  { level: 7, title: "Legend", minXP: 20000, maxXP: Infinity },
] as const;

export function getLevel(totalXP: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelProgress(totalXP: number) {
  const level = getLevel(totalXP);
  const range = level.maxXP - level.minXP;
  const progress = range === Infinity ? 100 : ((totalXP - level.minXP) / range) * 100;
  return { level: level.level, title: level.title, progress: Math.min(progress, 100), xp: totalXP };
}

// ─── Badges ────────────────────────────────────────────────────────────────

export const BADGES = [
  { id: "first_booking", label: "First Booking", icon: "CalendarCheck", description: "Made your first booking" },
  { id: "first_sale", label: "First Sale", icon: "Award", description: "Completed your first sale" },
  { id: "five_deliveries", label: "5 Deliveries", icon: "Truck", description: "Delivered 5 vehicles" },
  { id: "ten_deliveries", label: "10 Deliveries", icon: "Truck", description: "Delivered 10 vehicles" },
  { id: "fifty_deliveries", label: "50 Deliveries", icon: "Trophy", description: "Delivered 50 vehicles" },
  { id: "hundred_deliveries", label: "100 Deliveries", icon: "Crown", description: "Delivered 100 vehicles" },
  { id: "finance_expert", label: "Finance Expert", icon: "Banknote", description: "Approved 20 finance applications" },
  { id: "insurance_king", label: "Insurance King", icon: "Shield", description: "Sold 30 insurance policies" },
  { id: "suv_specialist", label: "SUV Specialist", icon: "Car", description: "Sold 15 SUVs" },
  { id: "luxury_specialist", label: "Luxury Specialist", icon: "Gem", description: "Sold 10 luxury vehicles" },
  { id: "ev_specialist", label: "EV Specialist", icon: "Zap", description: "Sold 10 electric vehicles" },
  { id: "customer_hero", label: "Customer Hero", icon: "Heart", description: "Received 10 five-star reviews" },
  { id: "perfect_documentation", label: "Perfect Documentation", icon: "FileCheck", description: "30 days without document issues" },
  { id: "monthly_winner", label: "Monthly Winner", icon: "Star", description: "Won monthly leaderboard" },
  { id: "annual_winner", label: "Annual Winner", icon: "Medal", description: "Won annual leaderboard" },
] as const;

// ─── Challenge Types ───────────────────────────────────────────────────────

export const CHALLENGE_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
} as const;

// ─── Schemas ───────────────────────────────────────────────────────────────

const schema = defineSchema(
  {
    ...authTables,

    // Custom Native Authentication
    passwords: defineTable({
      userId: v.id("users"),
      hash: v.string(),
    }).index("userId", ["userId"]),

    authSessions: defineTable({
      userId: v.id("users"),
      token: v.string(),
      expiresAt: v.number(),
    }).index("token", ["token"])
      .index("userId", ["userId"]),

    // Extended users with dealership data
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      employeeId: v.optional(v.string()),
      designation: v.optional(v.string()),
      department: v.optional(v.string()),
      dealer: v.optional(v.string()),
      branch: v.optional(v.string()),
      region: v.optional(v.string()),
      zone: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      managerId: v.optional(v.id("users")),
      totalXP: v.optional(v.number()),
      level: v.optional(v.number()),
      rank: v.optional(v.string()),
      badgeIds: v.optional(v.array(v.string())),
      createdAt: v.optional(v.number()),
    }).index("email", ["email"])
      .index("role", ["role"])
      .index("branch", ["branch"])
      .index("managerId", ["managerId"])
      .index("dealer", ["dealer"]),

    // Dealership locations
    dealers: defineTable({
      name: v.string(),
      city: v.string(),
      state: v.string(),
      region: v.string(),
      zone: v.string(),
      branches: v.array(v.string()),
    }).index("name", ["name"]),

    // CRM Event Logs
    events: defineTable({
      employeeId: v.id("users"),
      eventType: v.string(),
      description: v.optional(v.string()),
      xpAwarded: v.number(),
      metadata: v.optional(v.any()),
      timestamp: v.number(),
    }).index("employeeId", ["employeeId"])
      .index("eventType", ["eventType"])
      .index("timestamp", ["timestamp"])
      .index("employeeId_timestamp", ["employeeId", "timestamp"]),

    // XP Transactions
    xpTransactions: defineTable({
      employeeId: v.id("users"),
      amount: v.number(),
      eventType: v.string(),
      description: v.string(),
      balance: v.number(),
      timestamp: v.number(),
    }).index("employeeId", ["employeeId"])
      .index("employeeId_timestamp", ["employeeId", "timestamp"]),

    // Badges earned
    badges: defineTable({
      employeeId: v.id("users"),
      badgeId: v.string(),
      label: v.string(),
      earnedAt: v.number(),
    }).index("employeeId", ["employeeId"])
      .index("badgeId", ["badgeId"]),

    // Daily/Weekly/Monthly Challenges
    challenges: defineTable({
      type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      title: v.string(),
      description: v.string(),
      target: v.number(),
      progressField: v.union(
        v.literal("test_drives"),
        v.literal("finance_approvals"),
        v.literal("deliveries"),
        v.literal("bookings"),
        v.literal("insurance_sales"),
        v.literal("document_upload"),
        v.literal("leads_closed"),
        v.literal("suv_sales"),
        v.literal("xp_earned"),
      ),
      rewardXP: v.number(),
      rewardBadge: v.optional(v.string()),
      active: v.boolean(),
      startsAt: v.number(),
      endsAt: v.number(),
    }).index("type", ["type"])
      .index("active", ["active"]),

    // Employee challenge progress
    challengeProgress: defineTable({
      employeeId: v.id("users"),
      challengeId: v.id("challenges"),
      progress: v.number(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    }).index("employeeId", ["employeeId"])
      .index("challengeId", ["challengeId"])
      .index("employeeId_challengeId", ["employeeId", "challengeId"]),

    // Delegated Challenges (Manager -> Employee)
    assignedChallenges: defineTable({
      assignerId: v.id("users"),
      assigneeId: v.id("users"),
      title: v.string(),
      description: v.string(),
      rewardXP: v.number(),
      rewardBadgeId: v.optional(v.string()),
      status: v.union(
        v.literal("assigned"), 
        v.literal("pending_approval"), 
        v.literal("approved"), 
        v.literal("rejected")
      ),
      assignedAt: v.number(),
      completedAt: v.optional(v.number()),
      approvedAt: v.optional(v.number()),
      comments: v.optional(v.string()),
    }).index("assigneeId", ["assigneeId"])
      .index("assignerId", ["assignerId"])
      .index("status", ["status"]),

    // Leaderboard entries (snapshot/incremental)
    leaderboard: defineTable({
      periodType: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
      scope: v.union(v.literal("individual"), v.literal("branch"), v.literal("dealer"), v.literal("region"), v.literal("state"), v.literal("country"), v.literal("department")),
      periodStart: v.number(),
      periodEnd: v.number(),
      employeeId: v.optional(v.id("users")),
      branch: v.optional(v.string()),
      dealer: v.optional(v.string()),
      region: v.optional(v.string()),
      department: v.optional(v.string()),
      totalXP: v.number(),
      rank: v.number(),
      salesCount: v.optional(v.number()),
      deliveriesCount: v.optional(v.number()),
    }).index("periodType_scope", ["periodType", "scope"])
      .index("employeeId", ["employeeId"])
      .index("rank", ["rank"]),

    // Rewards Store
    rewards: defineTable({
      name: v.string(),
      description: v.string(),
      xpCost: v.number(),
      image: v.optional(v.string()),
      category: v.string(),
      stock: v.number(),
      active: v.boolean(),
    }),

    // Reward redemptions
    rewardRedemptions: defineTable({
      employeeId: v.id("users"),
      rewardId: v.id("rewards"),
      xpSpent: v.number(),
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("redeemed"), v.literal("cancelled")),
      redeemedAt: v.number(),
      approvedBy: v.optional(v.id("users")),
    }).index("employeeId", ["employeeId"])
      .index("status", ["status"]),

    // Spin Wheel history
    spinWheelSpins: defineTable({
      employeeId: v.id("users"),
      xpCost: v.number(),
      reward: v.string(),
      rewardType: v.string(),
      multiplier: v.optional(v.number()),
      spunAt: v.number(),
    }).index("employeeId", ["employeeId"]),

    // Notifications
    notifications: defineTable({
      employeeId: v.id("users"),
      type: v.union(
        v.literal("xp_earned"),
        v.literal("level_up"),
        v.literal("badge_unlocked"),
        v.literal("challenge_completed"),
        v.literal("leaderboard_rank"),
        v.literal("reward_ready"),
        v.literal("appreciation"),
        v.literal("announcement"),
        v.literal("system"),
      ),
      title: v.string(),
      message: v.string(),
      read: v.boolean(),
      metadata: v.optional(v.any()),
      createdAt: v.number(),
    }).index("employeeId", ["employeeId"])
      .index("employeeId_read", ["employeeId", "read"])
      .index("createdAt", ["createdAt"]),

    // Social Activity Feed
    activities: defineTable({
      employeeId: v.id("users"),
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
      likes: v.array(v.id("users")),
      comments: v.array(v.object({
        userId: v.id("users"),
        text: v.string(),
        createdAt: v.number(),
      })),
      createdAt: v.number(),
    }).index("employeeId", ["employeeId"])
      .index("createdAt", ["createdAt"]),

    // Sales / Pipeline records
    sales: defineTable({
      employeeId: v.id("users"), // Current Owner
      customerId: v.optional(v.id("customers")),
      customerName: v.optional(v.string()),
      carType: v.union(v.literal("passenger"), v.literal("suv"), v.literal("luxury"), v.literal("commercial"), v.literal("electric")),
      carModel: v.string(),
      amount: v.number(),
      status: v.union(
        v.literal("enquiry"),
        v.literal("assigned"),
        v.literal("contacted"),
        v.literal("visited"),
        v.literal("test_drive"),
        v.literal("quotation"),
        v.literal("negotiation"),
        v.literal("booked"),
        v.literal("finance"),
        v.literal("payment"),
        v.literal("allocation"),
        v.literal("accessories"),
        v.literal("insurance"),
        v.literal("registration"),
        v.literal("invoice"),
        v.literal("pdi"),
        v.literal("ready"),
        v.literal("delivered"),
        v.literal("feedback"),
        v.literal("cancelled")
      ),
      hasInsurance: v.boolean(),
      hasAccessories: v.boolean(),
      hasExchange: v.boolean(),
      bookingDate: v.number(),
      deliveryDate: v.optional(v.number()),
      expectedCompletionDate: v.optional(v.number()),
      createdAt: v.number(),
    }).index("employeeId", ["employeeId"])
      .index("status", ["status"])
      .index("carType", ["carType"])
      .index("bookingDate", ["bookingDate"]),

    // Customers / Leads
    customers: defineTable({
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      source: v.optional(v.string()),
      createdAt: v.number(),
    }).index("phone", ["phone"]),

    // Workflow Audit History
    workflowHistory: defineTable({
      saleId: v.id("sales"),
      previousStage: v.optional(v.string()),
      newStage: v.string(),
      changedBy: v.id("users"),
      comments: v.optional(v.string()),
      timestamp: v.number(),
    }).index("saleId", ["saleId"])
      .index("timestamp", ["timestamp"]),

    // Vehicles Catalog
    vehicles: defineTable({
      brand: v.string(),
      model: v.string(),
      category: v.string(), // suv, sedan, hatchback, etc.
      description: v.optional(v.string()),
      startingPrice: v.number(),
      thumbnailUrl: v.optional(v.string()),
      isPopular: v.optional(v.boolean()),
      createdAt: v.number(),
    }).index("category", ["category"])
      .index("isPopular", ["isPopular"]),

    vehicleVariants: defineTable({
      vehicleId: v.id("vehicles"),
      name: v.string(), // e.g. ZXi Plus Auto
      fuelType: v.string(),
      transmission: v.string(),
      mileage: v.string(),
      price: v.number(),
      features: v.array(v.string()),
    }).index("vehicleId", ["vehicleId"]),

    vehicleImages: defineTable({
      vehicleId: v.id("vehicles"),
      url: v.string(),
      type: v.string(), // exterior, interior, 360
    }).index("vehicleId", ["vehicleId"]),

    // Exchange / Trade-in Requests
    exchangeRequests: defineTable({
      customerId: v.optional(v.id("customers")),
      customerName: v.string(),
      phone: v.string(),
      brand: v.string(),
      model: v.string(),
      year: v.number(),
      kilometers: v.number(),
      conditionScore: v.optional(v.number()),
      estimatedValue: v.optional(v.number()),
      finalValue: v.optional(v.number()),
      status: v.union(v.literal("pending"), v.literal("evaluated"), v.literal("approved"), v.literal("rejected")),
      images: v.array(v.string()), // Cloudinary URLs
      createdAt: v.number(),
    }).index("status", ["status"]),

    // Locations
    locations: defineTable({
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
    }).index("locationCode", ["locationCode"]),

    // Employees
    employees: defineTable({
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
    }).index("employeeId", ["employeeId"])
      .index("locCode", ["locCode"]),

    // Event Logs
    eventLogs: defineTable({
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
    }).index("userId", ["userId"])
      .index("locationCode", ["locationCode"])
      .index("enquiryNo", ["enquiryNo"])
      .index("actionCode", ["actionCode"]),

    // Hierarchy rewards (XP distribution up the chain)
    hierarchyRewards: defineTable({
      sourceEmployeeId: v.id("users"),
      targetEmployeeId: v.id("users"),
      eventType: v.string(),
      sourceXP: v.number(),
      hierarchyXP: v.number(),
      hierarchyLevel: v.number(),
      timestamp: v.number(),
    }).index("targetEmployeeId", ["targetEmployeeId"])
      .index("sourceEmployeeId", ["sourceEmployeeId"])
      .index("timestamp", ["timestamp"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
