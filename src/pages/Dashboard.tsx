import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy, Zap, Target, TrendingUp, Car, DollarSign,
  Percent, Clock, CalendarCheck, FileText, Users,
  Star, Flame, ArrowUp, ArrowDown, Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";

function StatCard({ icon: Icon, label, value, sub, trend, className }: {
  icon: any; label: string; value: string | number; sub?: string; trend?: "up" | "down"; className?: string;
}) {
  return (
    <Card className="card-hover">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
            <p className={cn("text-xl sm:text-2xl font-semibold tracking-tight", className)}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend === "up" ? (
              <ArrowUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500" />
            )}
            <span className={cn("text-xs font-medium", trend === "up" ? "text-emerald-500" : "text-red-500")}>
              {trend === "up" ? "+" : "-"}12%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function XPProgressBar({ currentXP, level, rank, nextLevelXP, progress }: {
  currentXP: number; level: number; rank: string; nextLevelXP: number; progress: number;
}) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Level {level}</span>
                <Badge variant="secondary" className="text-xs font-medium">{rank}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{currentXP.toLocaleString()} XP earned</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{currentXP.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">/ {nextLevelXP.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-2.5 bg-secondary" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress)}% to next level</span>
            <span>{nextLevelXP - currentXP} XP remaining</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 animate-xp-pulse">
          <Flame className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">+250 XP today</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MissionCard({ title, description, progress, target, rewardXP, completed }: {
  title: string; description: string; progress: number; target: number; rewardXP: number; completed?: boolean;
}) {
  const pct = Math.min((progress / target) * 100, 100);
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
        completed ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary"
      )}>
        {completed ? <Star className="h-4 w-4" /> : <Target className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{title}</p>
          {completed && <Badge variant="secondary" className="text-[10px] h-5">Done</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">{progress}/{target}</span>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">+{rewardXP} XP</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userProgress = useQuery(api.gamification.getUserProgress);
  const stats = useQuery(api.analytics.getDashboardStats);
  const topRanked = useQuery(api.leaderboard.getTopRanked, { periodType: "monthly", limit: 5 });
  const activities = useQuery(api.notifications.getActivityFeed, { limit: 5 });
  const myRanks = useQuery(api.leaderboard.getMyRank);
  const challengesResult = useQuery(api.challenges.getActiveChallenges, { type: "daily" });

  const isLoading = !userProgress || !stats;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your gamification overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rankings</span>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="px-2 py-1 rounded-md bg-secondary">D: #{myRanks?.daily?.rank ?? "-"}</span>
            <span className="px-2 py-1 rounded-md bg-secondary">W: #{myRanks?.weekly?.rank ?? "-"}</span>
            <span className="px-2 py-1 rounded-md bg-secondary">M: #{myRanks?.monthly?.rank ?? "-"}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* XP Progress */}
          <XPProgressBar
            currentXP={stats.userXP}
            level={stats.userLevel}
            rank={stats.userRank}
            nextLevelXP={stats.userXP + 1000}
            progress={stats.userLevel % 100}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard icon={Car} label="Total Sales" value={stats.totalSales} trend="up" />
            <StatCard icon={DollarSign} label="Revenue" value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`} trend="up" />
            <StatCard icon={Percent} label="Conversion" value={`${stats.conversionRate}%`} trend="up" />
            <StatCard icon={Clock} label="Pending Finance" value={stats.pendingFinance} trend={stats.pendingFinance > 0 ? "down" : "up"} />
            <StatCard icon={CalendarCheck} label="Pending Reg." value={stats.pendingRegistration} />
            <StatCard icon={FileText} label="Pending Del." value={stats.pendingDelivery} trend={stats.pendingDelivery > 0 ? "down" : "up"} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Missions & Challenges */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Daily Missions</CardTitle>
                    <CardDescription>Complete challenges to earn XP</CardDescription>
                  </div>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => navigate("/missions")}>
                    View all
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {challengesResult && challengesResult.length > 0 ? (
                  challengesResult.slice(0, 4).map(({ challenge, progress }) => (
                    <MissionCard
                      key={challenge._id}
                      title={challenge.title}
                      description={challenge.description}
                      progress={progress?.progress ?? 0}
                      target={challenge.target}
                      rewardXP={challenge.rewardXP}
                      completed={progress?.completed ?? false}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No active missions. Check back later!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Preview + Activity */}
            <div className="space-y-6">
              {/* Top Rankings */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Leaderboard
                    </CardTitle>
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => navigate("/leaderboard")}>
                      This month
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topRanked && topRanked.length > 0 ? topRanked.slice(0, 5).map((entry: any, i: number) => (
                    <div key={entry._id} className="flex items-center gap-3 py-1.5">
                      <span className={cn(
                        "w-6 text-center text-xs font-bold",
                        i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"
                      )}>
                        #{entry.rank}
                      </span>
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-secondary">
                          {entry.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1 truncate">{entry.employee?.name ?? "Unknown"}</span>
                      <span className="text-xs font-medium">{entry.totalXP.toLocaleString()} XP</span>
                      {i < 3 && (
                        <span className="text-xs">{["🥇", "🥈", "🥉"][i]}</span>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No rankings yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activities && activities.length > 0 ? activities.slice(0, 4).map((activity: any) => (
                    <div key={activity._id} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Badges */}
          {userProgress.badges && userProgress.badges.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-500" />
                  Badges Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userProgress.badges.map((badge: any) => (
                    <Badge key={badge._id} variant="secondary" className="px-3 py-1.5 text-xs font-medium">
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
