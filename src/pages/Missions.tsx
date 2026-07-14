import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Swords, Target, Star, Flame, Clock, CheckCircle2,
  CalendarDays, CalendarRange, Trophy, Zap, Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ChallengeCard({ challenge, progress }: {
  challenge: any; progress: any;
}) {
  const pct = Math.min(((progress?.progress ?? 0) / challenge.target) * 100, 100);
  const completed = progress?.completed ?? false;

  return (
    <Card className={cn("card-hover", completed && "ring-1 ring-emerald-500/20")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              completed ? "bg-emerald-500/10" : "bg-secondary"
            )}>
              {completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Target className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{challenge.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
            </div>
          </div>
          {completed && (
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              Completed
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress?.progress ?? 0} / {challenge.target}</span>
          </div>
          <Progress value={pct} className={cn("h-2", completed && "bg-emerald-500/10")} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Zap className="h-3.5 w-3.5" />
            <span className="font-medium">+{challenge.rewardXP} XP</span>
          </div>
          {challenge.rewardBadge && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Gift className="h-3 w-3" />
              <span>Badge reward</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Missions() {
  const dailyChallenges = useQuery(api.challenges.getActiveChallenges, { type: "daily" });
  const weeklyChallenges = useQuery(api.challenges.getActiveChallenges, { type: "weekly" });
  const monthlyChallenges = useQuery(api.challenges.getActiveChallenges, { type: "monthly" });

  const isLoading = !dailyChallenges || !weeklyChallenges || !monthlyChallenges;

  const getCompletedCount = (challenges: any[]) =>
    challenges?.filter((c: any) => c.progress?.completed).length ?? 0;

  const getTotalXP = (challenges: any[]) =>
    challenges?.reduce((sum: number, c: any) => sum + (c.progress?.completed ? c.challenge.rewardXP : 0), 0) ?? 0;

  const allLoading = <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-36 rounded-xl" />
    ))}
  </div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Missions & Challenges</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete challenges to earn XP and climb the leaderboard</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="flex justify-center mb-2">
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-lg sm:text-2xl font-semibold">
              {getCompletedCount(dailyChallenges ?? []) + getCompletedCount(weeklyChallenges ?? []) + getCompletedCount(monthlyChallenges ?? [])}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="flex justify-center mb-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-lg sm:text-2xl font-semibold">
              {getTotalXP(dailyChallenges ?? []) + getTotalXP(weeklyChallenges ?? []) + getTotalXP(monthlyChallenges ?? [])}
            </p>
            <p className="text-xs text-muted-foreground">XP Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-lg sm:text-2xl font-semibold">
              {(dailyChallenges?.length ?? 0) + (weeklyChallenges?.length ?? 0) + (monthlyChallenges?.length ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Challenge Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="daily" className="text-xs sm:text-sm gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Daily</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs sm:text-sm gap-2">
            <CalendarRange className="h-4 w-4" />
            <span>Weekly</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs sm:text-sm gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Monthly</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          {isLoading ? allLoading : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyChallenges && dailyChallenges.length > 0 ? (
                dailyChallenges.map(({ challenge, progress }) => (
                  <ChallengeCard key={challenge._id} challenge={challenge} progress={progress} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                  No daily challenges available. Check back tomorrow!
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          {isLoading ? allLoading : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyChallenges && weeklyChallenges.length > 0 ? (
                weeklyChallenges.map(({ challenge, progress }) => (
                  <ChallengeCard key={challenge._id} challenge={challenge} progress={progress} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                  No weekly challenges available. Check back next week!
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          {isLoading ? allLoading : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthlyChallenges && monthlyChallenges.length > 0 ? (
                monthlyChallenges.map(({ challenge, progress }) => (
                  <ChallengeCard key={challenge._id} challenge={challenge} progress={progress} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                  No monthly challenges this month.
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
