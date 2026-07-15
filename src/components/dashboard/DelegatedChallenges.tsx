import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@/hooks/use-convex-auth";
import { api } from "@/convex/_generated/api";
import { Target, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DelegatedChallenges() {
  const challenges = useQuery(api.delegation.getMyDelegatedChallenges);
  const submitChallenge = useMutation(api.delegation.submitChallengeForApproval);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!challenges || challenges.length === 0) return null;

  const handleSubmit = async (id: string) => {
    try {
      setLoadingId(id);
      await submitChallenge({ challengeId: id as any });
      toast.success("Submitted for manager approval!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-500">
          <Target className="h-4 w-4" />
          Manager Assigned Missions
        </CardTitle>
        <CardDescription>Special missions assigned directly by your manager</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenges.map((c: any) => (
          <div key={c._id} className="p-3 bg-background rounded-lg border shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{c.title}</h4>
                  <Badge variant={
                    c.status === "assigned" ? "default" :
                    c.status === "pending_approval" ? "secondary" :
                    c.status === "approved" ? "outline" : "destructive"
                  } className="text-[10px] h-5">
                    {c.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  {c.periodType && (
                    <Badge variant="secondary" className="text-[10px] h-5 capitalize">
                      {c.periodType}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                <div className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Reward: {c.rewardXP} XP {c.rewardBadgeId && "+ Badge"}
                </div>
                {c.comments && (
                  <div className="mt-2 text-xs p-2 bg-secondary/50 rounded-md italic">
                    "{c.comments}"
                  </div>
                )}
              </div>
              
              {c.status === "assigned" && (
                <Button 
                  size="sm" 
                  onClick={() => handleSubmit(c._id)}
                  disabled={loadingId === c._id}
                >
                  {loadingId === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Approval"}
                </Button>
              )}
              {c.status === "approved" && (
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground flex justify-between border-t pt-2">
              <span>Assigned by {c.assignerName}</span>
              <span>{new Date(c.assignedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
