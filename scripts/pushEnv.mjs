import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authEnvPath = path.join(__dirname, "../.auth-local.env");
if (fs.existsSync(authEnvPath)) {
  const content = fs.readFileSync(authEnvPath, "utf-8");
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.trim() && line.includes("=")) {
      const idx = line.indexOf("=");
      const key = line.substring(0, idx).trim();
      const val = line.substring(idx + 1).trim();
      console.log(`Setting ${key}...`);
      
      try {
        const tmpFile = path.join(__dirname, `../.tmp-${key}.txt`);
        fs.writeFileSync(tmpFile, val, "utf-8");
        
        const { spawnSync } = await import("child_process");
        const result = spawnSync("npx", ["convex", "env", "set", key, `@${tmpFile}`], { shell: true, stdio: "inherit" });
        if (result.status !== 0) {
          console.error(`Failed to set ${key}`);
        }
        
        fs.unlinkSync(tmpFile);
      } catch (e) {
        console.error(e);
      }
    }
  }
}
