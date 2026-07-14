import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, TrendingUp, Users, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

const SCOPES = [
  { value: "individual", label: "Individual", icon: Users },
  { value: "branch", label: "Branch", icon: Building2 },
  { value: "dealer", label: "Dealer", icon: Building2 },
  { value: "region", label: "Region", icon: MapPin },
  { value: "department", label: "Department", icon: Users },
] as const;

function Podium({ entries }: { entries: any[] }) {
  if (!entries || entries.length === 0) return null;

  const podium = [entries[1], entries[0], entries[2]].filter(Boolean);

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-4 pt-8 pb-6">
      {podium.map((entry: any, i: number) => {
        const isFirst = entry?.rank === 1;
        const isSecond = entry?.rank === 2;
        const isThird = entry?.rank === 3;
        const height = isFirst ? "h-40" : isSecond ? "h-32" : "h-24";
        const medal = isFirst ? "🥇" : isSecond ? "🥈" : "🥉";
        const delay = isSecond ? "animate-podium-2" : isFirst ? "animate-podium-1" : "animate-podium-3";

        return (
          <div key={entry?._id ?? i} className={cn("flex flex-col items-center gap-2", delay)}>
            <span className="text-2xl">{medal}</span>
            <Avatar className="h-12 w-12 ring-2 ring-background">
              <AvatarFallback className="text-xs bg-secondary">
                {entry?.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-center leading-tight max-w-24 truncate">
              {entry?.employee?.name?.split(" ")[0] ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">{entry?.totalXP?.toLocaleString()} XP</span>
            <div className={cn(
              "w-20 sm:w-28 rounded-t-lg flex items-center justify-center text-xs font-semibold text-white",
              isFirst ? "h-40 bg-gradient-to-t from-amber-500 to-amber-400" :
              isSecond ? "h-32 bg-gradient-to-t from-slate-400 to-slate-300" :
              "h-24 bg-gradient-to-t from-amber-700 to-amber-600"
            )}>
              <span>#{entry?.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [scope, setScope] = useState<"individual" | "branch" | "dealer" | "region" | "department">("individual");

  const topRanked = useQuery(api.leaderboard.getTopRanked, { periodType: period, limit: 50 });
  const branchLeaderboard = scope !== "individual"
    ? useQuery(api.leaderboard.getTopRanked, { periodType: period, limit: 20 })
    : null;

  const isLoading = !topRanked;
  const top3 = topRanked?.slice(0, 3) ?? [];
  const rest = topRanked?.slice(3) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Top performers across the organization</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={(v: any) => setScope(v)}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-28 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-72 rounded-xl" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Podium */}
          {scope === "individual" && top3.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <Podium entries={top3} />
              </CardContent>
            </Card>
          )}

          {/* Rankings Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Rankings
              </CardTitle>
              <CardDescription>
                {topRanked?.length ?? 0} participants this {period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rest.length === 0 && top3.length === 0 ? (
                <div className="text-center py-12">
                  <Medal className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No rankings available yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <span className="col-span-1">Rank</span>
                    <span className="col-span-5">Name</span>
                    <span className="col-span-2 text-right">XP</span>
                    <span className="col-span-2 text-right">Sales</span>
                    <span className="col-span-2 text-right">Deliveries</span>
                  </div>

                  {[...top3, ...rest].slice(0, 50).map((entry: any, i: number) => {
                    const isMe = entry.employeeId === user?._id;
                    const rank = entry.rank;
                    return (
                      <div
                        key={entry._id}
                        className={cn(
                          "grid grid-cols-12 gap-3 items-center px-4 py-2.5 rounded-lg transition-colors text-sm",
                          isMe ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-secondary/50"
                        )}
                      >
                        <span className={cn(
                          "col-span-1 text-xs font-bold",
                          rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-amber-700" : "text-muted-foreground"
                        )}>
                          #{rank}
                        </span>
                        <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-[10px] bg-secondary">
                              {entry.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {entry.employee?.name ?? "Unknown"}
                              {isMe && <Badge variant="secondary" className="ml-2 text-[10px] h-4">You</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.employee?.role?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? ""}
                            </p>
                          </div>
                        </div>
                        <span className="col-span-2 text-right text-sm font-semibold">
                          {entry.totalXP?.toLocaleString() ?? 0}
                        </span>
                        <span className="col-span-2 text-right text-sm text-muted-foreground">
                          {entry.salesCount ?? 0}
                        </span>
                        <span className="col-span-2 text-right text-sm text-muted-foreground">
                          {entry.deliveriesCount ?? 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
