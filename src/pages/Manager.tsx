import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users, TrendingUp, DollarSign, Car, CheckCircle2,
  Clock, AlertCircle, UserCheck, Zap, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@/hooks/use-convex-auth";;
import { useState } from "react";

function PerformanceBar({ label, value, max, color }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color ?? "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TeamMemberCard({ member }: { member: any }) {
  const initials = member.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";
  const maxSales = 50;
  const maxDeliveries = 30;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-[10px] bg-secondary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{member.name}</p>
          <Badge variant="secondary" className="text-[10px] h-5">
            Lvl {member.level}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate capitalize">
          {member.role?.replace(/_/g, " ")}
        </p>
      </div>
      <div className="hidden sm:block w-24">
        <PerformanceBar label="Sales" value={member.salesCount} max={maxSales} color="bg-blue-500" />
      </div>
      <div className="hidden sm:block w-24">
        <PerformanceBar label="Deliveries" value={member.deliveriesCount} max={maxDeliveries} color="bg-emerald-500" />
      </div>
      <div className="flex items-center gap-1 text-xs">
        <Zap className="h-3 w-3 text-amber-500" />
        <span className="font-medium">{member.totalXP?.toLocaleString() ?? 0}</span>
      </div>
    </div>
  );
}

export default function Manager() {
  const { user } = useAuth();
  const managerData = useQuery(api.analytics.getManagerDashboard);
  const approveRedemption = useMutation(api.rewards.approveRedemption);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const isLoading = !managerData;

  const handleApprove = async (redemptionId: string) => {
    setApprovingId(redemptionId);
    try {
      await approveRedemption({ redemptionId: redemptionId as any });
      toast.success("Redemption approved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to approve");
    }
    setApprovingId(null);
  };

  if (!isLoading && !managerData) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Manager dashboard is only available for management roles</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manager Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Team performance and approvals</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Team Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-semibold">{managerData.teamSize}</p>
                    <p className="text-xs text-muted-foreground">Team Size</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-semibold">{managerData.totalTeamSales}</p>
                    <p className="text-xs text-muted-foreground">Total Sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-semibold">{managerData.totalTeamDeliveries}</p>
                    <p className="text-xs text-muted-foreground">Deliveries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-semibold">₹{(managerData.totalTeamRevenue / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Team Performance</CardTitle>
                <CardDescription>{managerData.teamSize} team members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {managerData.teamPerformance.map((member: any) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
                {managerData.teamPerformance.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No team members yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pending Approvals</CardTitle>
                <CardDescription>
                  {managerData.pendingApprovals.length} reward redemption{managerData.pendingApprovals.length !== 1 ? "s" : ""} pending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {managerData.pendingApprovals.map((approval: any) => (
                  <div key={approval._id} className="p-3 rounded-lg border border-border/40">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{approval.employee?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{approval.reward?.name ?? "Unknown"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">-{approval.xpSpent} XP</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(approval.redeemedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleApprove(approval._id)}
                      disabled={approvingId === approval._id}
                    >
                      {approvingId === approval._id ? "Approving..." : "Approve"}
                    </Button>
                  </div>
                ))}
                {managerData.pendingApprovals.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No pending approvals</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
