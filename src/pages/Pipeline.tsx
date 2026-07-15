import { useState } from "react";
import { useQuery, useMutation } from "@/hooks/use-convex-auth";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, ArrowRight, CheckCircle2 } from "lucide-react";

// For demo purposes, we limit to the primary stages
const PRIMARY_STAGES = [
  { id: "enquiry", label: "Enquiry" },
  { id: "test_drive", label: "Test Drive" },
  { id: "booked", label: "Booking" },
  { id: "finance", label: "Finance" },
  { id: "registration", label: "Registration" },
  { id: "ready", label: "Ready" },
];

const NEXT_STAGE_ROLES: Record<string, string[]> = {
  test_drive: ["sales_executive"],
  booked: ["sales_executive"],
  finance: ["finance_executive"],
  registration: ["insurance_executive", "service_advisor"],
  ready: ["service_advisor", "sales_executive"],
  delivered: ["sales_executive"],
};

function HandOffDialog({ 
  open, 
  onOpenChange, 
  saleId, 
  nextStage, 
  requiredRoles, 
  onConfirm 
}: { 
  open: boolean, 
  onOpenChange: (o: boolean) => void, 
  saleId: string, 
  nextStage: string, 
  requiredRoles: string[],
  onConfirm: (assigneeId: string) => void 
}) {
  const employees = useQuery(api.workflow.getEmployeesByRole, { roles: requiredRoles }) || [];
  const [selected, setSelected] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hand-off to {nextStage.replace("_", " ").toUpperCase()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Select an employee from the receiving department to assign this lead to.</p>
          <div className="space-y-2">
            <Label>Select Assignee</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp: any) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    {emp.name} ({emp.role.replace("_", " ")})
                  </SelectItem>
                ))}
                {employees.length === 0 && (
                  <SelectItem value="none" disabled>No employees found for this department</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => onConfirm(selected)} disabled={!selected || selected === "none"} className="w-full">
            Transfer & Advance
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Pipeline() {
  const pipeline = useQuery(api.workflow.getPipeline);
  const advanceStage = useMutation(api.workflow.advanceStage);
  const createEnquiry = useMutation(api.workflow.createEnquiry);
  
  const [isAdvancing, setIsAdvancing] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [handoff, setHandoff] = useState<{ open: boolean, saleId: string, nextStage: string, requiredRoles: string[] }>({
    open: false,
    saleId: "",
    nextStage: "",
    requiredRoles: [],
  });

  if (pipeline === undefined) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleAdvanceClick = (saleId: string, currentStage: string) => {
    const currentIndex = PRIMARY_STAGES.findIndex(s => s.id === currentStage);
    let nextStage = "delivered";
    if (currentIndex !== -1 && currentIndex < PRIMARY_STAGES.length - 1) {
      nextStage = PRIMARY_STAGES[currentIndex + 1].id;
    }
    
    const requiredRoles = NEXT_STAGE_ROLES[nextStage] || [];
    setHandoff({ open: true, saleId, nextStage, requiredRoles });
  };

  const executeAdvance = async (assigneeId: string) => {
    setIsAdvancing(handoff.saleId);
    setHandoff(prev => ({ ...prev, open: false }));
    try {
      await advanceStage({ 
        saleId: handoff.saleId as any, 
        newStage: handoff.nextStage,
        assigneeId: assigneeId as any,
      });
    } catch (error: any) {
      console.error("Failed to advance stage:", error);
      alert(`Failed to advance stage: ${error.message}`);
    } finally {
      setIsAdvancing(null);
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createEnquiry({
        customerName: formData.get("customerName") as string,
        phone: formData.get("phone") as string,
        carType: formData.get("carType") as string,
        carModel: formData.get("carModel") as string,
        amount: Number(formData.get("amount")),
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to create enquiry:", error);
      alert(`Failed to create enquiry: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-x-auto bg-muted/20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage leads from enquiry to delivery</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Enquiry
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Enquiry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEnquiry} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" name="customerName" required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" required placeholder="+1 234 567 8900" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carType">Car Type</Label>
                <Select name="carType" defaultValue="suv">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passenger">Passenger</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carModel">Car Model</Label>
                <Input id="carModel" name="carModel" required placeholder="e.g. Fortuner" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Deal Value (₹)</Label>
                <Input id="amount" name="amount" type="number" required placeholder="1500000" />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Enquiry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)] pb-4">
        {PRIMARY_STAGES.map((stage) => {
          const columnSales = pipeline.filter((s: any) => s.status === stage.id);
          
          return (
            <div key={stage.id} className="flex flex-col min-w-[300px] max-w-[300px] bg-muted/50 rounded-lg p-3 border">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  {stage.label}
                </h3>
                <Badge variant="secondary" className="rounded-full">
                  {columnSales.length}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {columnSales.map((sale: any) => (
                  <Card key={sale._id} className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-semibold">
                          {sale.customerName || "Customer"}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-mono">
                          ₹{(sale.amount / 100000).toFixed(1)}L
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {sale.carModel} ({sale.carType})
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(sale.bookingDate).toLocaleDateString()}
                        </span>
                        
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdvanceClick(sale._id, sale.status);
                          }}
                          disabled={isAdvancing === sale._id}
                        >
                          {isAdvancing === sale._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Advance <ArrowRight className="h-3 w-3 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {columnSales.length === 0 && (
                  <div className="h-24 border-2 border-dashed rounded-lg border-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Delivered (Success) Column */}
        <div className="flex flex-col min-w-[300px] max-w-[300px] bg-green-500/5 rounded-lg p-3 border border-green-500/20">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-green-600 dark:text-green-400">
              Delivered
            </h3>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="h-24 border-2 border-dashed rounded-lg border-green-500/20 flex items-center justify-center text-xs text-green-600/60 dark:text-green-400/60 text-center px-4">
            Vehicles delivered disappear from active pipeline. Track in Analytics!
          </div>
        </div>
      </div>
      
      {handoff.open && (
        <HandOffDialog 
          open={handoff.open} 
          onOpenChange={(o) => setHandoff(prev => ({ ...prev, open: o }))}
          saleId={handoff.saleId}
          nextStage={handoff.nextStage}
          requiredRoles={handoff.requiredRoles}
          onConfirm={executeAdvance}
        />
      )}
    </div>
  );
}
