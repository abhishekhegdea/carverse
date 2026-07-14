import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Shield, Users, Settings, Sliders, Bell,
  Search, UserCog, BarChart3, RefreshCw, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ROLES = [
  "super_admin", "regional_director", "regional_manager", "dealer_principal",
  "branch_manager", "sales_manager", "team_leader", "sales_executive",
  "finance_executive", "insurance_executive", "service_advisor", "customer",
] as const;

export default function Admin() {
  const { user } = useAuth();
  const allUsers = useQuery(api.gamification.getAllUsers);
  const updateRole = useMutation(api.gamification.updateUserRole);
  const [search, setSearch] = useState("");
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  const filteredUsers = allUsers?.filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleRoleChange = async (userId: string, role: string) => {
    setLoadingRole(userId);
    try {
      await updateRole({ userId: userId as any, role: role as any });
      toast.success("Role updated successfully");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    }
    setLoadingRole(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage employees, roles, and gamification settings</p>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="employees" className="text-xs sm:text-sm gap-2">
            <Users className="h-4 w-4" />
            <span>Employees</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm gap-2">
            <Sliders className="h-4 w-4" />
            <span>Gamification</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs sm:text-sm gap-2">
            <Bell className="h-4 w-4" />
            <span>Announcements</span>
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">All Employees</CardTitle>
                  <CardDescription>{allUsers?.length ?? 0} total employees</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-9 h-9 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!allUsers ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((u: any) => (
                    <div key={u._id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-[10px] bg-secondary">
                          {u.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email ?? ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Lvl {u.level ?? 1}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{u.totalXP ?? 0} XP</span>
                      </div>
                      {isSuperAdmin && (
                        <Select
                          value={u.role ?? "sales_executive"}
                          onValueChange={(v) => handleRoleChange(u._id, v)}
                          disabled={loadingRole === u._id}
                        >
                          <SelectTrigger className="w-40 h-8 text-xs">
                            {loadingRole === u._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role} className="text-xs">
                                {role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gamification Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* XP Rules */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">XP Rules</CardTitle>
                <CardDescription>Configure XP amounts for different events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { event: "Booking Created", xp: 50 },
                    { event: "Booking Confirmed", xp: 80 },
                    { event: "Finance Approved", xp: 100 },
                    { event: "Invoice Generated", xp: 120 },
                    { event: "Vehicle Delivered", xp: 250 },
                    { event: "Registration Completed", xp: 50 },
                    { event: "Insurance Sold", xp: 60 },
                    { event: "Test Drive", xp: 20 },
                    { event: "Booking Cancelled", xp: -40 },
                    { event: "Late Delivery", xp: -60 },
                    { event: "Finance Rejected", xp: -30 },
                  ].map((rule) => (
                    <div key={rule.event} className="flex items-center justify-between py-1.5 text-sm">
                      <span>{rule.event}</span>
                      <span className={cn("font-semibold", rule.xp > 0 ? "text-emerald-500" : "text-red-500")}>
                        {rule.xp > 0 ? "+" : ""}{rule.xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Levels */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Level System</CardTitle>
                <CardDescription>Current level configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { level: 1, title: "Rookie", range: "0 - 500" },
                    { level: 2, title: "Driver", range: "500 - 1,500" },
                    { level: 3, title: "Sales Rider", range: "1,500 - 3,500" },
                    { level: 4, title: "Turbo Seller", range: "3,500 - 7,000" },
                    { level: 5, title: "Elite Dealer", range: "7,000 - 12,000" },
                    { level: 6, title: "Champion", range: "12,000 - 20,000" },
                    { level: 7, title: "Legend", range: "20,000+" },
                  ].map((lvl) => (
                    <div key={lvl.level} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-5">Lvl {lvl.level}</Badge>
                        <span className="font-medium">{lvl.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{lvl.range}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Badges</CardTitle>
                <CardDescription>Earnable achievement badges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "First Booking", "First Sale", "5 Deliveries", "10 Deliveries",
                    "50 Deliveries", "100 Deliveries", "Finance Expert", "Insurance King",
                    "SUV Specialist", "Luxury Specialist", "EV Specialist",
                    "Customer Hero", "Perfect Documentation", "Monthly Winner", "Annual Winner",
                  ].map((badge) => (
                    <Badge key={badge} variant="secondary" className="px-3 py-1 text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hierarchy Rewards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hierarchy Rewards Distribution</CardTitle>
                <CardDescription>XP share from team members up the chain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm py-2 border-b border-border/40">
                    <span>Sales Executive</span>
                    <span className="font-semibold">100% (full XP)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 border-b border-border/40">
                    <span className="ml-6">→ Team Leader</span>
                    <span className="font-semibold text-amber-500">+30%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 border-b border-border/40">
                    <span className="ml-12">→ Sales Manager</span>
                    <span className="font-semibold text-amber-500">+20%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 border-b border-border/40">
                    <span className="ml-18">→ Regional Manager</span>
                    <span className="font-semibold text-amber-500">+10%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="ml-24">→ Regional Director</span>
                    <span className="font-semibold text-amber-500">+5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Post Announcement</CardTitle>
              <CardDescription>Share updates with the entire organization</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Announcement posting coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
