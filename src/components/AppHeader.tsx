import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router";
import { Bell, Moon, Sun, LogOut, User, Settings, ChevronDown, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/use-convex-auth";;

interface AppHeaderProps {
  onToggleTheme: () => void;
  isDark: boolean;
}

export function AppHeader({ onToggleTheme, isDark }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.getMyNotifications, { unreadOnly: true, limit: 5 });

  const unreadCount = notifications?.unreadCount ?? 0;
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 mx-6 mt-4 mb-2 rounded-2xl glass-panel relative z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Good</span>
            <span className="font-medium">
              {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
            </span>
          </div>
          {user?.name && (
            <span className="text-sm font-medium text-foreground">, {user.name.split(" ")[0]}</span>
          )}
        </div>
        {user?.level && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>Lvl {user.level}</span>
            <span className="text-muted-foreground">·</span>
            <span>{user.rank}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-foreground text-[10px] font-medium text-background flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 ml-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image} />
                <AvatarFallback className="text-[10px] bg-secondary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{user?.name ?? "User"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
