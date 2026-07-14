import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@/hooks/use-convex-auth";
import { api } from "@/convex/_generated/api";
import { Crown, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ManagerLeaderboardCard() {
  const managerRankings = useQuery(api.leaderboard.getManagerLeaderboard, { periodType: "monthly", limit: 3 });
  const myTeamStats = useQuery(api.leaderboard.getManagerPerformanceDetails);

  if (!managerRankings || !myTeamStats) return null;

  return (
    <div className="space-y-6">
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Crown className="h-4 w-4" />
            Top Managers (Monthly)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {managerRankings.length > 0 ? managerRankings.map((entry: any, i: number) => (
            <div key={entry._id} className="flex items-center justify-between p-2 rounded-lg bg-background border shadow-sm">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-6 text-center text-sm font-bold",
                  i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"
                )}>
                  #{entry.rank}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {entry.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "M"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{entry.employee?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.employee?.role?.replace("_", " ").toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{entry.totalXP.toLocaleString()} XP</p>
                <p className="text-[10px] text-muted-foreground">{entry.salesCount} Sales</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-xs text-muted-foreground">No managers ranked yet</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              My Team Performance Drill-down
            </div>
            <Badge variant="secondary">{myTeamStats.totalTeamXP.toLocaleString()} Total XP</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Team Sales</p>
              <p className="text-xl font-bold mt-1">{myTeamStats.totalTeamSales}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Members</p>
              <p className="text-xl font-bold mt-1">{myTeamStats.teamStats.length}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Individual Contributions</p>
            {myTeamStats.teamStats.length > 0 ? myTeamStats.teamStats.map((member: any) => {
              const pct = myTeamStats.totalTeamXP > 0 ? (member.totalXP / myTeamStats.totalTeamXP) * 100 : 0;
              return (
                <div key={member.employee._id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{member.employee.name}</span>
                    <span className="font-semibold">{member.totalXP.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1 bg-secondary" />
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {member.salesCount} Sales / {member.deliveriesCount} Deliveries
                  </p>
                </div>
              );
            }) : (
              <div className="text-center py-4 text-xs text-muted-foreground">No direct reportees found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
