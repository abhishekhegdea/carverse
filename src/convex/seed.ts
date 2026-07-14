import { authQuery, authMutation } from "./customAuth";
import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { getLevelProgress } from "./schema";

// ─── Dealership Data ───────────────────────────────────────────────────────

const DEALERS = [
  { name: "Silver Oak Motors", city: "Mumbai", state: "Maharashtra", region: "West", zone: "Zone 1", branches: ["Andheri", "Bandra", "Thane"] },
  { name: "Pinnacle Auto", city: "Delhi", state: "Delhi", region: "North", zone: "Zone 1", branches: ["Karol Bagh", "Connaught Place", "Dwarka"] },
  { name: "Royal Wheels", city: "Bangalore", state: "Karnataka", region: "South", zone: "Zone 2", branches: ["Whitefield", "Indiranagar", "Jayanagar"] },
  { name: "Elite Drive", city: "Chennai", state: "Tamil Nadu", region: "South", zone: "Zone 2", branches: ["Adyar", "Velachery", "OMR"] },
  { name: "Pacific Cars", city: "Kolkata", state: "West Bengal", region: "East", zone: "Zone 3", branches: ["Salt Lake", "Park Street", "Howrah"] },
];

const EMPLOYEES = [
  // Super Admin
  { name: "Arjun Mehta", designation: "CEO", department: "Management", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "super_admin" as const },
  // Regional Directors
  { name: "Priya Sharma", designation: "Regional Director", department: "Sales", dealer: "Pinnacle Auto", branch: "Karol Bagh", region: "North", role: "regional_director" as const },
  { name: "Rajesh Kumar", designation: "Regional Director", department: "Sales", dealer: "Royal Wheels", branch: "Whitefield", region: "South", role: "regional_director" as const },
  // Regional Managers
  { name: "Ananya Patel", designation: "Regional Manager", department: "Sales", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "regional_manager" as const },
  { name: "Vikram Singh", designation: "Regional Manager", department: "Sales", dealer: "Pinnacle Auto", branch: "Karol Bagh", region: "North", role: "regional_manager" as const },
  // Dealer Principals
  { name: "Suresh Reddy", designation: "Dealer Principal", department: "Sales", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "dealer_principal" as const },
  { name: "Deepa Iyer", designation: "Dealer Principal", department: "Sales", dealer: "Royal Wheels", branch: "Whitefield", region: "South", role: "dealer_principal" as const },
  // Branch Managers
  { name: "Rohit Joshi", designation: "Branch Manager", department: "Sales", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "branch_manager" as const },
  { name: "Neha Gupta", designation: "Branch Manager", department: "Sales", dealer: "Silver Oak Motors", branch: "Bandra", region: "West", role: "branch_manager" as const },
  { name: "Amit Verma", designation: "Branch Manager", department: "Sales", dealer: "Pinnacle Auto", branch: "Karol Bagh", region: "North", role: "branch_manager" as const },
  // Sales Managers
  { name: "Karan Walia", designation: "Sales Manager", department: "Sales", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "sales_manager" as const },
  { name: "Maya Das", designation: "Sales Manager", department: "Sales", dealer: "Royal Wheels", branch: "Whitefield", region: "South", role: "sales_manager" as const },
  // Team Leaders
  { name: "Ravi Shankar", designation: "Team Leader", department: "Sales", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "team_leader" as const },
  { name: "Sneha Kapoor", designation: "Team Leader", department: "Sales", dealer: "Silver Oak Motors", branch: "Bandra", region: "West", role: "team_leader" as const },
  { name: "Arun Nair", designation: "Team Leader", department: "Sales", dealer: "Pinnacle Auto", branch: "Karol Bagh", region: "North", role: "team_leader" as const },
  // Sales Executives
  { name: "Vivek Oberoi", designation: "Sales Executive", department: "Sales", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "sales_executive" as const },
  { name: "Pooja Mehta", designation: "Sales Executive", department: "Sales", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "sales_executive" as const },
  { name: "Rahul Desai", designation: "Sales Executive", department: "Sales", dealer: "Silver Oak Motors", branch: "Bandra", region: "West", role: "sales_executive" as const },
  { name: "Simran Kaur", designation: "Sales Executive", department: "Sales", dealer: "Pinnacle Auto", branch: "Karol Bagh", region: "North", role: "sales_executive" as const },
  { name: "Akash Yadav", designation: "Sales Executive", department: "Sales", dealer: "Royal Wheels", branch: "Whitefield", region: "South", role: "sales_executive" as const },
  { name: "Divya Nair", designation: "Sales Executive", department: "Sales", dealer: "Elite Drive", branch: "Adyar", region: "South", role: "sales_executive" as const },
  // Finance & Insurance
  { name: "Kavita Jain", designation: "Finance Executive", department: "Finance", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "finance_executive" as const },
  { name: "Manish Tiwari", designation: "Finance Executive", department: "Finance", dealer: "Pinnacle Auto", branch: "Karol Bagh", region: "North", role: "finance_executive" as const },
  { name: "Sarika Patel", designation: "Insurance Executive", department: "Insurance", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "insurance_executive" as const },
  { name: "Gaurav Shah", designation: "Service Advisor", department: "Service", dealer: "Silver Oak Motors", branch: "Andheri", region: "West", role: "service_advisor" as const },
];

const CAR_MODELS: Record<string, string[]> = {
  passenger: ["Swift", "City", "Verna", "Corolla", "Civic"],
  suv: ["Fortuner", "Creta", "Seltos", "XUV700", "Scorpio"],
  luxury: ["Mercedes E-Class", "BMW 5 Series", "Audi A6", "Lexus ES", "Jaguar XF"],
  commercial: ["Hiace", "Super Ace", "Tata Ace", "Eicher Pro"],
  electric: ["Nexon EV", "Kona EV", "Ioniq 5", "EV6", "Model 3"],
};

const EVENT_TYPES = [
  "BOOKING_CREATED", "FINANCE_APPROVED", "INVOICE_GENERATED",
  "VEHICLE_DELIVERED", "REGISTRATION_COMPLETED", "INSURANCE_SOLD",
  "TEST_DRIVE", "CUSTOMER_FEEDBACK_5_STAR", "BOOKING_CANCELLED",
  "LATE_DELIVERY", "ACCESSORIES_SOLD", "EXCHANGE_VEHICLE",
];

const CUSTOMER_NAMES = [
  "Amit Shah", "Rekha Sharma", "Vijay Patil", "Sunita Rao", "Deepak Jain",
  "Anita Verma", "Sanjay Gupta", "Meera Iyer", "Raj Kapoor", "Lata Deshmukh",
  "Nitin Agarwal", "Komal Joshi", "Prakash Nair", "Shweta Pandey", "Manoj Singh",
  "Kiran Bhat", "Rohan Malhotra", "Neelam Saxena", "Aditya Menon", "Sheela Das",
];

// ─── Run Seed ──────────────────────────────────────────────────────────────

export const runSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query("users").collect();
    // if (existingUsers.length > 0) return { seeded: false, message: "Data already exists" };

    // Create dealers
    await Promise.all(
      DEALERS.map(d =>
        ctx.db.insert("dealers", {
          name: d.name,
          city: d.city,
          state: d.state,
          region: d.region,
          zone: d.zone,
          branches: d.branches,
        })
      )
    );

    // Create users in order so we can set managerIds
    const employeeIds: string[] = [];

    for (const emp of EMPLOYEES) {
      const id = await ctx.db.insert("users", {
        name: emp.name,
        email: `${emp.name.toLowerCase().replace(/\s+/g, ".")}@carverse.com`,
        role: emp.role,
        designation: emp.designation,
        department: emp.department,
        dealer: emp.dealer,
        branch: emp.branch,
        region: emp.region,
        totalXP: Math.floor(Math.random() * 8000),
        level: 1,
        rank: "Rookie",
        badgeIds: [],
        createdAt: Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000),
      });
      employeeIds.push(id.toString());
    }

    // Set hierarchy
    const setHierarchy = async (role: string, managerRole: string) => {
      const managers = employeeIds.filter((_, i) => EMPLOYEES[i].role === managerRole);
      const reportees = employeeIds.filter((_, i) => EMPLOYEES[i].role === role);

      for (let i = 0; i < reportees.length; i++) {
        const mi = Math.min(i, managers.length - 1);
        if (managers[mi]) {
          await ctx.db.patch(reportees[i] as any, { managerId: managers[mi] as any });
        }
      }
    };

    await setHierarchy("regional_director", "super_admin");
    await setHierarchy("regional_manager", "regional_director");
    await setHierarchy("dealer_principal", "regional_manager");
    await setHierarchy("branch_manager", "dealer_principal");
    await setHierarchy("sales_manager", "branch_manager");
    await setHierarchy("team_leader", "sales_manager");
    await setHierarchy("sales_executive", "team_leader");
    await setHierarchy("finance_executive", "branch_manager");
    await setHierarchy("insurance_executive", "branch_manager");
    await setHierarchy("service_advisor", "branch_manager");

    // Update levels based on XP
    for (const id of employeeIds) {
      const user = await ctx.db.get(id as any);
      if (user && (user as any).totalXP) {
        const info = getLevelProgress((user as any).totalXP);
        await ctx.db.patch(id as any, { level: info.level, rank: info.title });
      }
    }

    // Generate events and XP transactions
    const now = Date.now();
    for (const empId of employeeIds) {
      const numEvents = 5 + Math.floor(Math.random() * 20);
      const xpMap: Record<string, number> = {
        BOOKING_CREATED: 50, BOOKING_CONFIRMED: 80, FINANCE_APPROVED: 100,
        INVOICE_GENERATED: 120, VEHICLE_DELIVERED: 250, REGISTRATION_COMPLETED: 50,
        INSURANCE_SOLD: 60, TEST_DRIVE: 20, CUSTOMER_FEEDBACK_5_STAR: 100,
        ACCESSORIES_SOLD: 40, EXCHANGE_VEHICLE: 70, BOOKING_CANCELLED: -40,
        LATE_DELIVERY: -60,
      };

      let runningBalance = 0;
      for (let e = 0; e < numEvents; e++) {
        const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
        const xp = xpMap[eventType] ?? 50;
        runningBalance += xp;
        const daysAgo = Math.floor(Math.random() * 60);

        await ctx.db.insert("events", {
          employeeId: empId as any,
          eventType,
          description: `${eventType.replace(/_/g, " ")}`,
          xpAwarded: xp,
          metadata: { source: "seed" },
          timestamp: now - daysAgo * 24 * 60 * 60 * 1000,
        });

        await ctx.db.insert("xpTransactions", {
          employeeId: empId as any,
          amount: xp,
          eventType,
          description: `XP from ${eventType.replace(/_/g, " ")}`,
          balance: Math.max(0, runningBalance),
          timestamp: now - daysAgo * 24 * 60 * 60 * 1000,
        });
      }
    }

    // Generate sales
    for (const empId of employeeIds) {
      const emp = await ctx.db.get(empId as any);
      if (!emp) continue;
      const numSales = 1 + Math.floor(Math.random() * 8);

      for (let s = 0; s < numSales; s++) {
        const carTypeKeys = Object.keys(CAR_MODELS);
        const carType = carTypeKeys[Math.floor(Math.random() * carTypeKeys.length)];
        const models = CAR_MODELS[carType];
        const model = models[Math.floor(Math.random() * models.length)];
        const customer = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
        const daysAgo = Math.floor(Math.random() * 90);
        const statuses = ["enquiry", "test_drive", "booked", "finance", "invoice", "registration", "delivered"] as const;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amounts: Record<string, number> = { passenger: 800000, suv: 1500000, luxury: 5000000, commercial: 1200000, electric: 2000000 };

        await ctx.db.insert("sales", {
          employeeId: empId as any,
          customerName: customer,
          carType: carType as any,
          carModel: model,
          amount: amounts[carType] + Math.floor(Math.random() * 500000),
          status,
          hasInsurance: Math.random() > 0.5,
          hasAccessories: Math.random() > 0.7,
          hasExchange: Math.random() > 0.8,
          bookingDate: now - daysAgo * 24 * 60 * 60 * 1000,
          deliveryDate: status === "delivered" ? now - (daysAgo - 7) * 24 * 60 * 60 * 1000 : undefined,
          createdAt: now - daysAgo * 24 * 60 * 60 * 1000,
        });
      }
    }

    // Generate sample rewards
    await ctx.runMutation(internal.rewards.initializeRewards, {});

    // 8. Seed Vehicles Catalog
    const existingVehicles = await ctx.db.query("vehicles").collect();
    if (existingVehicles.length === 0) {
      await ctx.db.insert("vehicles", {
        brand: "Maruti Suzuki",
        model: "Grand Vitara",
        category: "suv",
        startingPrice: 1099000,
        isPopular: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1635334237145-c1e956e1841a?q=80&w=2070&auto=format&fit=crop",
        createdAt: Date.now(),
      });
      await ctx.db.insert("vehicles", {
        brand: "Hyundai",
        model: "Creta",
        category: "suv",
        startingPrice: 1100000,
        isPopular: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?q=80&w=2070&auto=format&fit=crop",
        createdAt: Date.now(),
      });
      await ctx.db.insert("vehicles", {
        brand: "Tata",
        model: "Nexon EV",
        category: "electric",
        startingPrice: 1474000,
        isPopular: false,
        thumbnailUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop",
        createdAt: Date.now(),
      });
      console.log("✅ Seeded vehicles.");
    }

    console.log("🎉 Database seeded successfully.");
    return "Seed complete!";
  },
});

// ─── Admin-Triggered Seed ──────────────────────────────────────────────────

export const triggerSeed = authMutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string; seeded?: boolean }> => {
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { success: false, message: "Database already has data. Delete users first to re-seed." };
    }

    // Use internal mutation approach
    const res = await ctx.runMutation(internal.seed.runSeed, {});
    return { success: true, message: res.message, seeded: res.seeded };
  },
});
