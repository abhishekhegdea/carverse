import { useAuth } from "@/hooks/use-auth";
import { Outlet, Navigate } from "react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useState } from "react";

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Restore the security lock
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <AppHeader onToggleTheme={toggleTheme} isDark={isDark} />
          <main className="flex-1 overflow-y-auto p-6 pt-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
