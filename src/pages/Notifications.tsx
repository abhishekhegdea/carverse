import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import {
  Bell, Zap, Trophy, Medal, Target, Gift,
  Heart, Megaphone, Info, CheckCheck, Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, any> = {
  xp_earned: Zap,
  level_up: Trophy,
  badge_unlocked: Medal,
  challenge_completed: Target,
  leaderboard_rank: Trophy,
  reward_ready: Gift,
  appreciation: Heart,
  announcement: Megaphone,
  system: Info,
};

const TYPE_COLORS: Record<string, string> = {
  xp_earned: "text-amber-500 bg-amber-500/10",
  level_up: "text-emerald-500 bg-emerald-500/10",
  badge_unlocked: "text-violet-500 bg-violet-500/10",
  challenge_completed: "text-blue-500 bg-blue-500/10",
  leaderboard_rank: "text-amber-500 bg-amber-500/10",
  reward_ready: "text-green-500 bg-green-500/10",
  appreciation: "text-rose-500 bg-rose-500/10",
  announcement: "text-orange-500 bg-orange-500/10",
  system: "text-muted-foreground bg-secondary",
};

export default function Notifications() {
  const { user } = useAuth();
  const notificationsData = useQuery(api.notifications.getMyNotifications, { limit: 50 });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const isLoading = !notificationsData;
  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = notificationsData?.unreadCount ?? 0;

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      await markAsRead({ notificationId: id as any });
    } catch (err) {
      console.error("Mark as read error:", err);
    }
    setMarkingId(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map((notification: any) => {
            const Icon = TYPE_ICONS[notification.type] ?? Bell;
            const colorClass = TYPE_COLORS[notification.type] ?? "text-muted-foreground bg-secondary";
            const isUnread = !notification.read;

            return (
              <div
                key={notification._id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer group",
                  isUnread ? "bg-secondary/30 hover:bg-secondary/50" : "hover:bg-secondary/30"
                )}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
              >
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn("text-sm", isUnread && "font-medium")}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                    </div>
                    {isUnread && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()} · {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {isUnread && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification._id);
                    }}
                  >
                    {markingId === notification._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
