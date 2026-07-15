import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flag, Trophy, Plane } from "lucide-react";
import { useQuery, useMutation } from "@/hooks/use-convex-auth";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { motion } from "framer-motion";

export function BranchRaceTrack() {
  const activeRaces = useQuery(api.raceEngine.getActiveRaces);

  // Auto initialize if needed, usually done by admin, but we expose the button for testing
  const initializeRace = useMutation(api.raceEngine.initializeRace);

  if (activeRaces === undefined) return <div className="animate-pulse h-64 bg-secondary/20 rounded-xl" />;

  const race = activeRaces[0];

  if (!race) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Flag className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold">No Active Branch Races</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            There are currently no branch competitions running. Check back later or ask your regional director to start one!
          </p>
          <Button onClick={() => initializeRace()} className="mt-6" variant="outline">
            Initialize Demo Race
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sort branches by sales so the leader is on top
  const sortedProgress = [...race.progress].sort((a, b) => b.sales - a.sales);

  return (
    <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Flag className="h-6 w-6" />
              {race.title}
            </CardTitle>
            <CardDescription className="text-base mt-1 text-foreground/80 font-medium">
              {race.description}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg px-3 py-1 flex items-center gap-1.5 text-sm">
              <Plane className="h-4 w-4" />
              Grand Prize: {race.reward}
            </Badge>
            <span className="text-xs text-muted-foreground mt-2 font-mono">
              TARGET: {race.targetSales} SALES
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-8 relative">
          {/* Finish Line Indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-8 border-l-2 border-dashed border-red-500/50 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="rotate-90 text-xs font-bold text-red-500/80 tracking-widest bg-background/50 px-2 py-1 rounded">
              FINISH
            </div>
          </div>

          {sortedProgress.map((p, idx) => {
            const percentage = Math.min((p.sales / race.targetSales) * 100, 100);
            const isLeader = idx === 0 && p.sales > 0;
            
            return (
              <div key={p.branch} className="relative z-20">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    {p.branch}
                    {isLeader && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                  </span>
                  <span className="text-xs font-mono font-bold">{p.sales} / {race.targetSales}</span>
                </div>
                
                <div className="h-6 bg-secondary/50 rounded-full overflow-hidden relative border border-border/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`absolute top-0 left-0 bottom-0 rounded-full flex items-center justify-end pr-2
                      ${isLeader ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-slate-400 to-slate-500'}
                    `}
                  >
                    <span className="text-[10px] text-white font-bold tracking-wider">
                      {Math.round(percentage)}%
                    </span>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
