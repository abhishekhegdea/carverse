import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronDown, ChevronRight, Zap, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

function TreeNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group",
          "hover:bg-secondary/50",
          depth === 0 && "bg-secondary/30"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{ marginLeft: depth * 20 }}
      >
        {/* Expand/Collapse */}
        <div className="w-4 flex justify-center">
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <div className="h-3.5 w-3.5" />
          )}
        </div>

        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-[10px] bg-secondary">
            {node.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{node.name}</span>
            <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
              {node.role?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? ""}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{node.email}</p>
        </div>

        {/* XP & Level */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>{node.totalXP?.toLocaleString() ?? 0}</span>
          </div>
          <Badge variant="outline" className="text-[10px] h-5">Lvl {node.level ?? 1}</Badge>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="border-l border-border/40 ml-6 mt-1">
          {node.children.map((child: any) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Hierarchy() {
  const tree = useQuery(api.analytics.getHierarchyTree);
  const isLoading = !tree;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization Hierarchy</h1>
        <p className="text-sm text-muted-foreground mt-1">View the company structure and team reporting lines</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold">{isLoading ? "-" : tree?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Directors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {isLoading ? "-" : tree?.reduce((count: number, n: any) => {
                  const countChildren = (node: any): number => 1 + (node.children?.reduce((s: number, c: any) => s + countChildren(c), 0) ?? 0);
                  return count + countChildren(n);
                }, 0) ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {isLoading ? "-" : tree?.reduce((max: number, n: any) => {
                  const maxXP = (node: any): number => Math.max(node.totalXP ?? 0, ...(node.children?.map((c: any) => maxXP(c)) ?? [0]));
                  return Math.max(max, maxXP(n));
                }, 0)?.toLocaleString() ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Highest XP</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy Tree */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reporting Structure</CardTitle>
          <CardDescription>Click on any node to expand/collapse</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : tree && tree.length > 0 ? (
            <div className="space-y-1">
              {tree.map((root: any) => (
                <TreeNode key={root.id} node={root} depth={0} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No hierarchy data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
