import { Id } from "./_generated/dataModel";

export async function getAuthUserId(ctx: any): Promise<Id<"users"> | null> {
  // Read the userId that was injected by our custom authQuery/authMutation wrappers!
  return ctx.userId ?? null;
}
