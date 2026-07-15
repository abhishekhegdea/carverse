import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, Calculator, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

// Hardcoded Master List for Demo
const VEHICLE_DATA: Record<string, string[]> = {
  "Maruti Suzuki": ["Swift", "Baleno", "Dzire", "Ertiga", "Brezza", "WagonR"],
  "Hyundai": ["i20", "Creta", "Venue", "Verna", "Grand i10", "Tucson"],
  "Tata": ["Nexon", "Punch", "Harrier", "Safari", "Tiago", "Altroz"],
  "Mahindra": ["XUV700", "Scorpio-N", "Thar", "XUV300", "Bolero"],
  "Honda": ["City", "Amaze", "Elevate"],
  "Toyota": ["Innova Crysta", "Innova Hycross", "Fortuner", "Glanza", "Hyryder"],
};

export default function Exchange() {
  const submitAndEvaluate = useMutation(api.exchange.submitAndEvaluateExchange);
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Dependent Dropdown State
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEvaluating(true);
    setResult(null);

    try {
      const formData = new FormData(e.currentTarget);
      
      const res = await submitAndEvaluate({
        customerName: formData.get("customerName") as string,
        phone: formData.get("phone") as string,
        brand: selectedBrand,
        model: selectedModel,
        variant: formData.get("variant") as string,
        manufacturingYear: Number(formData.get("manufacturingYear")),
        registrationYear: Number(formData.get("registrationYear")),
        fuelType: formData.get("fuelType") as string,
        transmission: formData.get("transmission") as string,
        kilometers: Number(formData.get("kilometers")),
        ownerCount: Number(formData.get("ownerCount")),
        insuranceValidity: formData.get("insuranceValidity") as string,
        accidentHistory: formData.get("accidentHistory") as string,
        serviceHistory: formData.get("serviceHistory") as string,
        rcAvailable: formData.get("rcAvailable") === "true",
        loanPending: formData.get("loanPending") === "true",
        city: formData.get("city") as string,
        vehicleCondition: formData.get("vehicleCondition") as string,
        tyreCondition: formData.get("tyreCondition") as string,
        images: ["placeholder_image_1.jpg"], // Mocked upload
      });
      
      setResult(res.valuation);
    } catch (error: any) {
      alert(`Evaluation failed: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Calculator className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-500">Transparent Rule-Based Valuation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Evaluate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Old Car</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get an instant, explainable estimated value based on exact dealership rules. No hidden math, no random AI guesses.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle>Vehicle & Ownership Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Your Name</Label>
                    <Input id="customerName" name="customerName" required placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" required placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Select required value={selectedBrand} onValueChange={(val) => { setSelectedBrand(val); setSelectedModel(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(VEHICLE_DATA).map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select required disabled={!selectedBrand} value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger><SelectValue placeholder={selectedBrand ? "Select Model" : "Choose Brand first"} /></SelectTrigger>
                      <SelectContent>
                        {selectedBrand && VEHICLE_DATA[selectedBrand]?.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variant">Variant</Label>
                    <Input id="variant" name="variant" required placeholder="VXI" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturingYear">Mfg Year</Label>
                    <Input id="manufacturingYear" name="manufacturingYear" type="number" required defaultValue={2018} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationYear">Reg Year</Label>
                    <Input id="registrationYear" name="registrationYear" type="number" required defaultValue={2018} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" required placeholder="Mumbai" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kilometers">Kilometers Driven</Label>
                    <Input id="kilometers" name="kilometers" type="number" required defaultValue={45000} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type</Label>
                    <Select name="fuelType" defaultValue="petrol">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="ev">Electric (EV)</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select name="transmission" defaultValue="manual">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerCount">Owner Count</Label>
                    <Select name="ownerCount" defaultValue="1">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Owner</SelectItem>
                        <SelectItem value="2">2nd Owner</SelectItem>
                        <SelectItem value="3">3rd Owner</SelectItem>
                        <SelectItem value="4">4+ Owners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceValidity">Insurance</Label>
                    <Select name="insuranceValidity" defaultValue="comprehensive">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comprehensive">Comprehensive (Valid)</SelectItem>
                        <SelectItem value="third_party">Third Party Only</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceHistory">Service History</Label>
                    <Select name="serviceHistory" defaultValue="authorized">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="authorized">Authorized Center</SelectItem>
                        <SelectItem value="partial">Partial Records</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="poor">Poor Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accidentHistory">Accident History</Label>
                    <Select name="accidentHistory" defaultValue="none">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Accidents</SelectItem>
                        <SelectItem value="minor">Minor Accident</SelectItem>
                        <SelectItem value="major">Major Accident</SelectItem>
                        <SelectItem value="flood">Flood Damage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleCondition">Overall Condition</Label>
                    <Select name="vehicleCondition" defaultValue="good">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tyreCondition">Tyre Condition</Label>
                    <Select name="tyreCondition" defaultValue="good">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Almost New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="replace">Needs Replacement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loanPending">Loan Pending?</Label>
                    <Select name="loanPending" defaultValue="false">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rcAvailable">RC Available?</Label>
                    <Select name="rcAvailable" defaultValue="true">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Simulated Image Upload */}
                <div className="space-y-2 mt-4">
                  <Label>Upload Images</Label>
                  <div className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-secondary/20 transition-colors cursor-pointer">
                    <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Click to upload car photos</p>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-6 h-12 text-lg" disabled={isEvaluating}>
                  {isEvaluating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calculator className="h-5 w-5 mr-2" />}
                  Evaluate Vehicle
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div>
            <Card className="h-full border-border/50 bg-secondary/10 flex flex-col p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
              
              <div className="relative z-10 w-full h-full flex flex-col">
                {!result && !isEvaluating && (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <Calculator className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Awaiting Data</p>
                    <p className="text-sm mt-2 text-center max-w-xs">Fill out the form with accurate details to get a transparent, step-by-step valuation breakdown.</p>
                  </div>
                )}

                {isEvaluating && (
                  <div className="flex-1 flex flex-col items-center justify-center text-blue-500">
                    <Loader2 className="h-16 w-16 animate-spin mb-6" />
                    <p className="text-xl font-semibold animate-pulse">Running Dealership Rules...</p>
                  </div>
                )}

                {result && !isEvaluating && (
                  <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full flex-1 flex flex-col">
                    <div className="text-center mb-6">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                      <h3 className="text-2xl font-bold">Evaluation Complete</h3>
                    </div>
                    
                    <div className="bg-background rounded-2xl p-6 shadow-inner border text-center mb-6">
                      <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-2">Estimated Range</p>
                      <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
                        ₹{(result.priceRangeMin / 100000).toFixed(2)}L - ₹{(result.priceRangeMax / 100000).toFixed(2)}L
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Base Price: ₹{(result.basePrice / 100000).toFixed(2)}L
                      </p>
                    </div>

                    <div className="bg-background rounded-xl border p-4 mb-6 flex-1 overflow-y-auto">
                      <h4 className="text-sm font-bold border-b pb-2 mb-3">Calculation Breakdown</h4>
                      <div className="space-y-3">
                        {result.breakdown.map((b: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">{b.step}</span>
                              <p className="text-xs text-muted-foreground">{b.description}</p>
                            </div>
                            <div className="text-right">
                              <span className={b.percentage >= 0 ? "text-emerald-500 font-medium" : "text-destructive font-medium"}>
                                {b.percentage > 0 ? "+" : ""}{b.percentage.toFixed(1)}%
                              </span>
                              <p className="text-xs font-mono">₹{b.absoluteValue.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-left mb-4">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-500">Important Customer Note</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          The value shown above is an estimated exchange price calculated using dealership valuation rules based on vehicle age, kilometers driven, ownership history, and condition. <strong className="text-foreground">This is NOT the final exchange value.</strong> The final quotation will be confirmed only after a physical inspection by our experts.
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-auto" 
                      variant="default"
                      onClick={() => alert("Your request has been successfully submitted to the Exchange Desk for physical inspection scheduling!")}
                    >
                      Submit for Physical Inspection
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
