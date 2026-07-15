import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@/hooks/use-convex-auth";
import { api } from "@/convex/_generated/api";
import { Target, Users, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ManagerDelegationPortal() {
  const reportees = useQuery(api.delegation.getReportees);
  const delegatedChallenges = useQuery(api.delegation.getChallengesDelegatedByMe);
  const assignChallenge = useMutation(api.delegation.assignChallenge);
  const approveChallenge = useMutation(api.delegation.approveChallenge);
  const rejectChallenge = useMutation(api.delegation.rejectChallenge);

  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [periodType, setPeriodType] = useState("daily");
  const [rewardXP, setRewardXP] = useState("100");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!reportees || !delegatedChallenges) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignee) {
      toast.error("Please select an employee");
      return;
    }
    try {
      setIsAssigning(true);
      await assignChallenge({
        assigneeId: selectedAssignee as any,
        title,
        description,
        periodType: periodType as any,
        rewardXP: parseInt(rewardXP),
      });
      toast.success("Challenge assigned successfully!");
      setDialogOpen(false);
      setTitle("");
      setDescription("");
      setRewardXP("100");
      setSelectedAssignee("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setLoadingId(id);
      await approveChallenge({ challengeId: id as any, comments: "Great job!" });
      toast.success("Challenge approved! XP awarded.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setLoadingId(id);
      await rejectChallenge({ challengeId: id as any, comments: "Needs more work." });
      toast.success("Challenge rejected.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const pendingApprovals = delegatedChallenges.filter(c => c.status === "pending_approval");
  const otherChallenges = delegatedChallenges.filter(c => c.status !== "pending_approval");

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-500">
              <CheckCircle className="h-4 w-4" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((c) => (
              <div key={c._id} className="p-3 bg-background rounded-lg border shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">{c.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Completed by {c.assigneeName}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleReject(c._id)} disabled={loadingId === c._id}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => handleApprove(c._id)} disabled={loadingId === c._id}>
                    {loadingId === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & Award XP"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delegation Portal */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team Delegation Portal
            </CardTitle>
            <CardDescription>Assign custom challenges to your direct reportees</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Assign New Mission</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Mission</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssign} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign To</label>
                  <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportees.map(r => (
                        <SelectItem key={r._id} value={r._id}>{r.name} ({r.role.replace("_", " ")})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mission Title</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Sell 3 SUVs this week" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide specific instructions..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Period</label>
                  <Select value={periodType} onValueChange={setPeriodType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">XP Reward</label>
                  <Input type="number" value={rewardXP} onChange={e => setRewardXP(e.target.value)} required min="10" max="5000" />
                </div>
                <Button type="submit" className="w-full" disabled={isAssigning}>
                  {isAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Assign Mission"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        {otherChallenges.length > 0 && (
          <CardContent className="space-y-3 pt-2">
            {otherChallenges.map((c) => (
              <div key={c._id} className="p-3 bg-secondary/20 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{c.title}</h4>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {c.status.toUpperCase()}
                    </Badge>
                    {c.periodType && (
                      <Badge variant="secondary" className="text-[10px] h-5 capitalize">
                        {c.periodType}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Assigned to {c.assigneeName} • {c.rewardXP} XP</p>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
