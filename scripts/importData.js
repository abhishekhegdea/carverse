import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";
import { api } from "../src/convex/_generated/api.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from the parent directory
dotenv.config({ path: path.join(__dirname, "../.env.local") });

if (!process.env.VITE_CONVEX_URL) {
  console.error("VITE_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL);

const BASE_DIR = "D:\\Downloads\\carverse files";

// Helper to chunk arrays
function chunkArray(array, size) {
  const chunked = [];
  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, size + index));
    index += size;
  }
  return chunked;
}

// ─── Import Locations ──────────────────────────────────────────────────────
async function importLocations() {
  console.log("Importing locations...");
  const locations = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(BASE_DIR, "z_locations.csv"))
      .pipe(csv())
      .on("data", (data) => {
        locations.push({
          locationId: data.location_id || "",
          locationGroup: data.location_group || "",
          bookingHub: data.booking_hub || "",
          clusterId: data.cluster_id || "",
          locationCode: data.location_code || "",
          locationName: data.location_name || "",
          locationDms: data.location_dms || undefined,
          outletType: data.outlet_type || undefined,
          outletFunction: data.outlet_function || undefined,
          locationStatus: data.location_status || "",
          locationAddedDatetime: data.location_added_datetime || "",
          latlng: data.latlng || undefined,
        });
      })
      .on("end", async () => {
        const chunks = chunkArray(locations, 200);
        let count = 0;
        for (const chunk of chunks) {
          await client.mutation(api.dataset.importLocations, { locations: chunk });
          count += chunk.length;
          console.log(`Inserted ${count}/${locations.length} locations`);
        }
        console.log("Locations imported!");
        resolve();
      })
      .on("error", reject);
  });
}

// ─── Import Employees ──────────────────────────────────────────────────────
async function importEmployees() {
  console.log("Importing employees...");
  const employees = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(BASE_DIR, "z_employees.csv"))
      .pipe(csv())
      .on("data", (data) => {
        employees.push({
          groupId: data.group_id || "",
          employeeId: data.id || "",
          name: data.name || "",
          mobile: data.mobile || undefined,
          locCode: data.loc_code || "",
          reportingLocation: data.reporting_location || undefined,
          designation: data.designation || undefined,
          manager: data.manager || undefined,
          dseCode: data.dse_code || undefined,
          department: data.department || "",
          roleRights: data.role_rights || undefined,
          status: data.status || undefined,
          createdDate: data.created_date || undefined,
        });
      })
      .on("end", async () => {
        const chunks = chunkArray(employees, 200);
        let count = 0;
        for (const chunk of chunks) {
          await client.mutation(api.dataset.importEmployees, { employees: chunk });
          count += chunk.length;
          console.log(`Inserted ${count}/${employees.length} employees`);
        }
        console.log("Employees imported!");
        resolve();
      })
      .on("error", reject);
  });
}

// ─── Import Event Logs ─────────────────────────────────────────────────────
async function importEventLogs() {
  console.log("Importing event logs...");
  let logsBatch = [];
  let totalCount = 0;
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(path.join(BASE_DIR, "z_event_log_may_june_2026.csv"))
      .pipe(csv());
      
    stream.on("data", async (data) => {
      logsBatch.push({
        logId: data.id || "",
        groupId: data.group_id || undefined,
        stage: data.stage || undefined,
        categories: data.categories || undefined,
        department: data.department || "",
        username: data.username || "",
        userId: data.user_id || "",
        enquiryNo: data.enquiry_no || "",
        locationCode: data.location_code || "",
        message: data.message || undefined,
        actionCode: data.action_code || "",
        source: data.source || undefined,
        createdDate: data.created_date || "",
      });
      
      if (logsBatch.length >= 500) {
        stream.pause();
        await client.mutation(api.dataset.importEventLogs, { eventLogs: logsBatch });
        totalCount += logsBatch.length;
        console.log(`Inserted ${totalCount} event logs...`);
        logsBatch = [];
        stream.resume();
      }
    })
    .on("end", async () => {
      if (logsBatch.length > 0) {
        await client.mutation(api.dataset.importEventLogs, { eventLogs: logsBatch });
        totalCount += logsBatch.length;
      }
      console.log(`Event logs imported! Total: ${totalCount}`);
      resolve();
    })
    .on("error", reject);
  });
}

async function run() {
  try {
    await importLocations();
    await importEmployees();
    await importEventLogs();
    console.log("All data imported successfully!");
  } catch (error) {
    console.error("Error during import:", error);
  }
}

run();
