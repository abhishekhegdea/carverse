/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as authHelper from "../authHelper.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as catalog from "../catalog.js";
import type * as challenges from "../challenges.js";
import type * as cron from "../cron.js";
import type * as customAuth from "../customAuth.js";
import type * as dataset from "../dataset.js";
import type * as delegation from "../delegation.js";
import type * as economyEngine from "../economyEngine.js";
import type * as exchange from "../exchange.js";
import type * as exchangeEngine from "../exchangeEngine.js";
import type * as gameEngine from "../gameEngine.js";
import type * as gamification from "../gamification.js";
import type * as http from "../http.js";
import type * as leaderboard from "../leaderboard.js";
import type * as managerEngine from "../managerEngine.js";
import type * as missionEngine from "../missionEngine.js";
import type * as notifications from "../notifications.js";
import type * as promotionEngine from "../promotionEngine.js";
import type * as raceEngine from "../raceEngine.js";
import type * as rewards from "../rewards.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as workflow from "../workflow.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  authActions: typeof authActions;
  authHelper: typeof authHelper;
  "auth/emailOtp": typeof auth_emailOtp;
  catalog: typeof catalog;
  challenges: typeof challenges;
  cron: typeof cron;
  customAuth: typeof customAuth;
  dataset: typeof dataset;
  delegation: typeof delegation;
  economyEngine: typeof economyEngine;
  exchange: typeof exchange;
  exchangeEngine: typeof exchangeEngine;
  gameEngine: typeof gameEngine;
  gamification: typeof gamification;
  http: typeof http;
  leaderboard: typeof leaderboard;
  managerEngine: typeof managerEngine;
  missionEngine: typeof missionEngine;
  notifications: typeof notifications;
  promotionEngine: typeof promotionEngine;
  raceEngine: typeof raceEngine;
  rewards: typeof rewards;
  seed: typeof seed;
  users: typeof users;
  workflow: typeof workflow;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
