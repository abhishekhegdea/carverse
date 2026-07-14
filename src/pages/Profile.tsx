import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User, Zap, Trophy, Medal, Clock, Calendar,
  Building2, MapPin, Tag, Gift, TrendingUp, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { user } = useAuth();
  const userProgress = useQuery(api.gamification.getUserProgress);
  const stats = useQuery(api.analytics.getDashboardStats);
  const myRanks = useQuery(api.leaderboard.getMyRank);

  const isLoading = !userProgress || !stats;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const levelProgress = userProgress?.levelProgress;
  const badges = userProgress?.badges ?? [];
  const recentXP = userProgress?.recentXP ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <CardContent className="p-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              <AvatarImage src={user?.image} />
              <AvatarFallback className="text-2xl bg-secondary">
                {user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-12 sm:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{user?.name ?? "User"}</h1>
                <Badge variant="secondary" className="text-[10px]">
                  {user?.role?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? ""}
                </Badge>
                <Badge variant="outline" className="text-[10px]">Level {levelProgress?.level ?? 1}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{user?.email ?? ""}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                {user?.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {user.department}
                  </span>
                )}
                {user?.branch && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {user.branch}
                  </span>
                )}
                {user?.dealer && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {user.dealer}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {myRanks && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="px-2 py-1 rounded-md bg-secondary">D: #{myRanks.daily?.rank ?? "-"}</span>
                  <span className="px-2 py-1 rounded-md bg-secondary">W: #{myRanks.weekly?.rank ?? "-"}</span>
                  <span className="px-2 py-1 rounded-md bg-secondary">M: #{myRanks.monthly?.rank ?? "-"}</span>
                </div>
              )}
            </div>
          </div>

          {/* XP Section */}
          <div className="mt-6 p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">{levelProgress?.title ?? "Rookie"}</span>
              </div>
              <span className="text-sm font-bold">{levelProgress?.xp?.toLocaleString() ?? 0} XP</span>
            </div>
            <Progress value={levelProgress?.progress ?? 0} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(levelProgress?.progress ?? 0)}% to next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="stats">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="stats" className="text-xs sm:text-sm">Stats</TabsTrigger>
          <TabsTrigger value="badges" className="text-xs sm:text-sm">Badges</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">XP History</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs sm:text-sm">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{stats.totalSales}</p>
                <p className="text-xs text-muted-foreground">Total Sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{stats.deliveredSales}</p>
                <p className="text-xs text-muted-foreground">Deliveries</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{stats.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{stats.monthlyXPGained}</p>
                <p className="text-xs text-muted-foreground">Monthly XP</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{badges.length}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Medal className="h-4 w-4 text-amber-500" />
                Badges
              </CardTitle>
              <CardDescription>{badges.length} badge{badges.length !== 1 ? "s" : ""} earned</CardDescription>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {badges.map((badge: any) => (
                    <div key={badge._id} className="p-3 rounded-lg bg-secondary/50 text-center">
                      <Medal className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">{badge.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No badges earned yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent XP Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentXP.length > 0 ? (
                <div className="space-y-2">
                  {recentXP.map((tx: any) => (
                    <div key={tx._id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div>
                        <p className="text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleDateString()} · {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={cn(
                        "text-sm font-semibold",
                        tx.amount > 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No XP transactions yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Achievement timeline coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
