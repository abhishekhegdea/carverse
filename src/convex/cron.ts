import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily leaderboard computation at midnight
crons.daily("compute-daily-leaderboard", { hourUTC: 0, minuteUTC: 5 }, internal.leaderboard.computeLeaderboard, {
  periodType: "daily",
});

// Weekly leaderboard computation on Monday
crons.weekly("compute-weekly-leaderboard", { dayOfWeek: "monday", hourUTC: 0, minuteUTC: 10 }, internal.leaderboard.computeLeaderboard, {
  periodType: "weekly",
});

// Monthly leaderboard computation on 1st
crons.cron("compute-monthly-leaderboard", "0 15 1 * *", internal.leaderboard.computeLeaderboard, {
  periodType: "monthly",
});

// Generate daily challenges at midnight
crons.daily("generate-daily-challenges", { hourUTC: 0, minuteUTC: 0 }, internal.challenges.generateChallenges, {
  type: "daily",
});

// Generate weekly challenges on Monday
crons.weekly("generate-weekly-challenges", { dayOfWeek: "monday", hourUTC: 0, minuteUTC: 5 }, internal.challenges.generateChallenges, {
  type: "weekly",
});

// Generate monthly challenges on 1st
crons.cron("generate-monthly-challenges", "0 0 1 * *", internal.challenges.generateChallenges, {
  type: "monthly",
});

export default crons;
