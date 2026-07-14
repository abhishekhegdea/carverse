import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@/hooks/use-convex-auth";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, PieChart, Activity, TrendingUp, DollarSign, Crosshair, Ban, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ icon: Icon, title, value, color }: { icon: any, title: string, value: number | string, color?: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", color ?? "bg-primary/10 text-primary")}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const funnel = useQuery(api.analytics.getSalesFunnel);
  const stats = useQuery(api.analytics.getDashboardStats);

  const isLoading = !funnel || !stats;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Detailed breakdown of the sales pipeline</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Crosshair} title="Total Bookings" value={funnel.total} color="bg-blue-500/10 text-blue-500" />
        <StatCard icon={Activity} title="In Progress" value={funnel.total - funnel.delivered - funnel.cancelled} color="bg-amber-500/10 text-amber-500" />
        <StatCard icon={CheckCircle2} title="Delivered" value={funnel.delivered} color="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={Ban} title="Cancelled" value={funnel.cancelled} color="bg-red-500/10 text-red-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pipeline Breakdown
            </CardTitle>
            <CardDescription>Current status of all active vehicles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Booked", value: funnel.bookings, color: "bg-slate-500" },
              { label: "Finance / Documentation", value: funnel.financePending, color: "bg-blue-500" },
              { label: "Registration / PDI", value: funnel.registrationPending, color: "bg-indigo-500" },
              { label: "Ready for Delivery", value: funnel.invoiceGenerated, color: "bg-amber-500" },
              { label: "Delivered", value: funnel.delivered, color: "bg-emerald-500" },
            ].map((stage, i) => {
              const pct = funnel.total > 0 ? (stage.value / funnel.total) * 100 : 0;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span>{stage.value}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", stage.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Sales by Category
            </CardTitle>
            <CardDescription>Breakdown of all your delivered vehicles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {Object.entries(stats.salesByType).map(([category, count], i) => {
               if (count === 0) return null;
               const pct = stats.totalSales > 0 ? (count as number / stats.totalSales) * 100 : 0;
               return (
                 <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                   <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                       <span className="text-xs font-bold text-primary">{Math.round(pct)}%</span>
                     </div>
                     <span className="capitalize font-medium text-sm">{category}</span>
                   </div>
                   <span className="font-bold">{count as number}</span>
                 </div>
               );
             })}
             {Object.values(stats.salesByType).every(v => v === 0) && (
               <div className="text-center py-8 text-muted-foreground text-sm">
                 No sales data available yet
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
