import type { AuthConfig } from "convex/server";

const issuer = "http://127.0.0.1:3211";

export default {
  providers: [
    {
      type: "customJwt",
      issuer,
      jwks: `${issuer}/api/web/.well-known/jwks.json`,
      applicationID: "convex",
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
