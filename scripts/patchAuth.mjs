import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const convexDir = path.join(__dirname, "../src/convex");

const files = fs.readdirSync(convexDir).filter(f => f.endsWith(".ts"));
for (const file of files) {
  const filePath = path.join(convexDir, file);
  let content = fs.readFileSync(filePath, "utf-8");
  
  if (content.includes('@convex-dev/auth/server')) {
    content = content.replace(/import\s+\{\s*getAuthUserId\s*\}\s+from\s+"@convex-dev\/auth\/server";/g, 'import { getAuthUserId } from "./authHelper";');
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Patched ${file} to bypass strict auth.`);
  }
}
