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
      {/* Premium Cinematic Dashboard Background */}
      <div className="fixed inset-0 bg-[#080A0D] z-[-3]"></div>
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat opacity-40 transition-opacity duration-1000"
        style={{ backgroundImage: 'url(/showroom_bg.jpg)' }}
      ></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] bg-destructive/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
        <div className="absolute top-[30%] right-[-10%] w-[30vw] h-[30vw] bg-cyan-500/10 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
      </div>

      <div className="flex h-screen w-full overflow-hidden bg-transparent">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden bg-transparent">
          <AppHeader onToggleTheme={toggleTheme} isDark={isDark} />
          <main className="flex-1 overflow-y-auto p-6 pt-4 relative z-10">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
