import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, "../src");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

for (const file of files) {
  if (file.includes("use-convex-auth.ts") || file.includes("use-auth.ts") || file.includes("main.tsx") || file.includes("customAuth.ts") || file.includes("authHelper.ts")) continue;
  
  let content = fs.readFileSync(file, "utf-8");
  
  if (content.includes('from "convex/react"')) {
    // Replace useQuery and useMutation imports
    content = content.replace(/import\s*\{([^}]*)\}\s*from\s*"convex\/react"/g, (match, p1) => {
      let coreImports = [];
      let customImports = [];
      p1.split(',').forEach(i => {
        const item = i.trim();
        if (item === 'useQuery' || item === 'useMutation') {
          customImports.push(item);
        } else if (item) {
          coreImports.push(item);
        }
      });
      
      let newImport = '';
      if (coreImports.length > 0) {
        newImport += `import { ${coreImports.join(', ')} } from "convex/react";\n`;
      }
      if (customImports.length > 0) {
        newImport += `import { ${customImports.join(', ')} } from "@/hooks/use-convex-auth";`;
      }
      return newImport;
    });
    
    fs.writeFileSync(file, content, "utf-8");
    console.log(`Patched frontend file: ${file}`);
  }
}
