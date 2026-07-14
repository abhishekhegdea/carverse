import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const convexDir = path.join(__dirname, "../src/convex");

const files = fs.readdirSync(convexDir).filter(f => f.endsWith(".ts"));

for (const file of files) {
  if (file === "customAuth.ts" || file === "authActions.ts" || file === "schema.ts" || file === "auth.ts") continue;
  
  const filePath = path.join(convexDir, file);
  let content = fs.readFileSync(filePath, "utf-8");
  
  if (content.includes('query({') || content.includes('mutation({')) {
    // Inject import
    if (!content.includes('authQuery')) {
      content = 'import { authQuery, authMutation } from "./customAuth";\n' + content;
    }
    
    // Replace query({ and mutation({
    content = content.replace(/query\s*\(\s*\{/g, 'authQuery({');
    content = content.replace(/mutation\s*\(\s*\{/g, 'authMutation({');
    
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Patched backend file: ${file}`);
  }
}
