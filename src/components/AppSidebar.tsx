import { useAuth } from "@/hooks/use-auth";
import { useLocation, useNavigate } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.svg";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Gift,
  Users,
  BarChart3,
  Bell,
  Rss,
  UserCircle,
  Shield,
  Settings,
  ChevronRight,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Pipeline CRM", icon: GitMerge, path: "/pipeline" },
  { label: "Leaderboard", icon: Trophy, path: "/leaderboard" },
  { label: "Missions", icon: Swords, path: "/missions" },
  { label: "Rewards Store", icon: Gift, path: "/rewards" },
  { label: "Hierarchy", icon: Users, path: "/hierarchy" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Social Feed", icon: Rss, path: "/social" },
  { label: "Profile", icon: UserCircle, path: "/profile" },
];

const adminItems = [
  { label: "Admin Panel", icon: Shield, path: "/admin" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "super_admin" || user?.role === "regional_director" || user?.role === "dealer_principal";
  const isManager = isAdmin || user?.role === "branch_manager" || user?.role === "sales_manager" || user?.role === "team_leader";

  return (
    <Sidebar collapsible="icon" variant="floating" className="glass-panel border-none shadow-2xl m-3 rounded-2xl overflow-hidden backdrop-blur-3xl bg-background/40">
      <SidebarHeader className="flex items-center gap-2 px-4 py-3">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/dashboard")}
        >
          <img src={logo} alt="Carverse" className="h-8 w-8 rounded-md" />
          <span className="font-bold text-lg tracking-tight group-hover:opacity-80 transition-opacity text-gradient">
            Carverse
          </span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "group relative overflow-hidden rounded-xl transition-all duration-300 hover:bg-white/5",
                        isActive && "bg-primary/10 text-primary font-medium border border-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] shadow-primary/10"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isManager && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {isAdmin && adminItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={isActive}
                          tooltip={item.label}
                          className={cn(
                            "group relative overflow-hidden rounded-xl transition-all duration-300 hover:bg-white/5",
                            isActive && "bg-primary/10 text-primary font-medium border border-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] shadow-primary/10"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
