import crypto from "crypto";
import { spawnSync } from "child_process";
import fs from "fs";

try {
  console.log("Generating fresh, perfectly formatted RSA keys...");
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "jwk" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });

  // Write exact PEM string to temp file
  fs.writeFileSync(".tmp-priv.txt", privateKey, "utf-8");
  
  console.log("Pushing JWT_PRIVATE_KEY to Convex...");
  const res1 = spawnSync("npx", ["convex", "env", "set", "JWT_PRIVATE_KEY", "@.tmp-priv.txt"], { shell: true, stdio: "inherit" });
  if (res1.status !== 0) throw new Error("Failed to set JWT_PRIVATE_KEY");
  fs.unlinkSync(".tmp-priv.txt");

  console.log("Pushing JWKS to Convex...");
  const jwks = JSON.stringify({
    keys: [
      {
        use: "sig",
        kty: "RSA",
        n: publicKey.n,
        e: publicKey.e,
        alg: "RS256"
      }
    ]
  });
  
  const res2 = spawnSync("npx", ["convex", "env", "set", "JWKS", jwks], { shell: true, stdio: "inherit" });
  if (res2.status !== 0) throw new Error("Failed to set JWKS");

  console.log("✅ SUCCESSFULLY GENERATED AND INJECTED FLAWLESS KEYS!");
} catch (error) {
  console.error("Error generating keys:", error);
}
