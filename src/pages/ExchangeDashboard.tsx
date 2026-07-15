import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardCheck, CarFront, FileText, UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ExchangeDashboard() {
  const { user } = useAuth();
  const requests = useQuery(api.exchange.getExchangeRequests) || [];
  const submitInspection = useMutation(api.exchange.submitInspectionReport);
  const transferToSales = useMutation(api.exchange.transferToSales);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [finalPrice, setFinalPrice] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const pendingRequests = requests.filter(r => r.status === "pending");
  const inspectedRequests = requests.filter(r => r.status === "inspected" || r.status === "approved" || r.status === "rejected");

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !user) return;
    
    setIsSubmitting(true);
    try {
      await submitInspection({
        exchangeRequestId: selectedRequest._id,
        executiveId: user._id as any,
        finalPrice: Number(finalPrice),
        reasonForDifference: reason,
        inspectionNotes: notes,
        images: ["inspected_image.jpg"],
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      alert("Failed to submit report: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInspection = (req: any) => {
    setSelectedRequest(req);
    setFinalPrice(req.estimatedValue.toString());
    setReason("");
    setNotes("");
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exchange Executive Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage pending vehicle inspections and finalize exchange valuations.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Inspections */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Pending Inspections ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                No pending requests.
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req._id} className="p-4 rounded-xl border bg-background/50 hover:bg-secondary/20 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold">{req.brand} {req.model} {req.variant}</h3>
                    <p className="text-sm text-muted-foreground">{req.customerName} • {req.kilometers.toLocaleString()} km • {req.manufacturingYear}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Est: ₹{(req.estimatedValue / 100000).toFixed(2)}L
                      </Badge>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        {req.vehicleCondition}
                      </Badge>
                    </div>
                  </div>
                  <Button onClick={() => openInspection(req)} variant="default" className="w-full sm:w-auto">
                    <ClipboardCheck className="h-4 w-4 mr-2" /> Inspect
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Inspected Vehicles */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Recent Inspections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inspectedRequests.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                No recent inspections.
              </div>
            ) : (
              inspectedRequests.slice(0, 5).map(req => (
                <div key={req._id} className="p-4 rounded-xl border bg-background/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-75">
                  <div>
                    <h3 className="font-bold">{req.brand} {req.model}</h3>
                    <p className="text-sm text-muted-foreground">Final: ₹{req.finalValue?.toLocaleString()} (Est: ₹{req.estimatedValue.toLocaleString()})</p>
                    <p className="text-xs text-muted-foreground mt-1">Reason: {req.reasonForDifference || "N/A"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      {req.status === "approved" ? "Transferred" : "Inspected"}
                    </Badge>
                    {req.status === "inspected" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={async () => {
                          if (user) {
                            await transferToSales({ exchangeRequestId: req._id, executiveId: user._id as any });
                            alert("Transferred to Sales Pipeline!");
                          }
                        }}
                      >
                        Transfer to Sales CRM
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inspection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Physical Inspection Report</DialogTitle>
            <DialogDescription>
              Review the automated estimate and provide the final physical valuation.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="mt-4 space-y-6">
              {/* Context Panel */}
              <div className="bg-muted rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Customer</span>
                  <p className="font-medium">{selectedRequest.customerName} ({selectedRequest.phone})</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Vehicle</span>
                  <p className="font-medium">{selectedRequest.brand} {selectedRequest.model} {selectedRequest.variant}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Automated Estimated Value</span>
                  <p className="font-mono text-blue-500 font-bold text-lg">₹{selectedRequest.estimatedValue.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Price Range</span>
                  <p className="font-mono text-muted-foreground">₹{selectedRequest.priceRangeMin.toLocaleString()} - ₹{selectedRequest.priceRangeMax.toLocaleString()}</p>
                </div>
              </div>

              <form onSubmit={handleInspect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="finalPrice">Final Offered Price (₹)</Label>
                  <Input 
                    id="finalPrice" 
                    type="number" 
                    required 
                    value={finalPrice} 
                    onChange={e => setFinalPrice(e.target.value)} 
                    className="font-mono text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Mandatory Reason (If different from estimate)</Label>
                  <Select required value={reason} onValueChange={setReason}>
                    <SelectTrigger><SelectValue placeholder="Select primary reason" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matched">Matched Estimate Exactly</SelectItem>
                      <SelectItem value="physical_dents">Physical Dents / Scratches</SelectItem>
                      <SelectItem value="engine_issue">Mechanical / Engine Issues</SelectItem>
                      <SelectItem value="tyre_wear">Excessive Tyre Wear</SelectItem>
                      <SelectItem value="interior_damage">Interior / Upholstery Damage</SelectItem>
                      <SelectItem value="paint_quality">Poor Paint Quality / Repainted</SelectItem>
                      <SelectItem value="better_condition">Better Condition Than Reported</SelectItem>
                      <SelectItem value="accessories_added">Valuable Accessories Present</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Detailed Inspection Notes</Label>
                  <Textarea 
                    id="notes" 
                    required 
                    placeholder="Describe specific issues found during physical inspection..." 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Inspection Photos</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-secondary/50">
                    <UploadCloud className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Click to upload physical inspection images</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  Submit Final Valuation
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
