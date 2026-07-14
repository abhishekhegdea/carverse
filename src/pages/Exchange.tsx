import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, Calculator, Sparkles, CheckCircle2 } from "lucide-react";

export default function Exchange() {
  const evaluateExchangeML = useAction(api.exchange.evaluateExchangeML);
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<{ estimatedValue: number, conditionScore: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEvaluating(true);
    setResult(null);

    try {
      const formData = new FormData(e.currentTarget);
      
      // We simulate creating the exchange request and getting the ML estimation
      // Since it's a demo, we'll directly call the ML action with dummy exchangeId
      // In a real flow, you'd call submitExchangeRequest mutation first.
      
      const res = await evaluateExchangeML({
        exchangeId: "placeholder_id" as any, // Mocking for demo visual
        brand: formData.get("brand") as string,
        year: Number(formData.get("year")),
        kilometers: Number(formData.get("kilometers")),
      });
      
      setResult(res);
    } catch (error: any) {
      alert(`Evaluation failed: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-500">AI-Powered Valuation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Trade In Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">Old Car</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your car's details and our Vision ML Model will instantly generate an estimated exchange value for you to use towards a new purchase!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Your Name</Label>
                  <Input id="customerName" name="customerName" required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" required placeholder="+91 98765 43210" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" name="brand" required placeholder="e.g. Maruti" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" name="model" required placeholder="e.g. Swift" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Mfg Year</Label>
                    <Input id="year" name="year" type="number" required placeholder="2018" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kilometers">Kilometers Driven</Label>
                    <Input id="kilometers" name="kilometers" type="number" required placeholder="45000" />
                  </div>
                </div>
                
                {/* Simulated Image Upload */}
                <div className="space-y-2 mt-4">
                  <Label>Upload Images (Simulated Cloudinary)</Label>
                  <div className="border-2 border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-secondary/20 transition-colors cursor-pointer">
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Click to upload car photos</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Front, Rear, Left, Right, Interior</p>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 mt-6 h-12 text-lg" disabled={isEvaluating}>
                  {isEvaluating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calculator className="h-5 w-5 mr-2" />}
                  Evaluate with AI
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div>
            <Card className="h-full border-border/50 bg-secondary/10 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5" />
              
              <div className="relative z-10 w-full">
                {!result && !isEvaluating && (
                  <div className="text-muted-foreground">
                    <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Awaiting Evaluation</p>
                    <p className="text-sm mt-2">Fill the form and let our ML model analyze your car's condition.</p>
                  </div>
                )}

                {isEvaluating && (
                  <div className="text-violet-500 flex flex-col items-center">
                    <Loader2 className="h-16 w-16 animate-spin mb-6" />
                    <p className="text-xl font-semibold animate-pulse">Running Vision Transformer...</p>
                    <p className="text-sm text-muted-foreground mt-2">Analyzing image quality and depreciation curves.</p>
                  </div>
                )}

                {result && !isEvaluating && (
                  <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Evaluation Complete</h3>
                    
                    <div className="bg-background rounded-2xl p-6 mt-8 shadow-inner border">
                      <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-2">Estimated Value</p>
                      <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                        ₹{(result.estimatedValue / 100000).toFixed(2)}L
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-background rounded-xl p-4 border text-left">
                        <p className="text-xs text-muted-foreground mb-1">AI Condition Score</p>
                        <p className="text-2xl font-bold text-violet-500">{result.conditionScore}/100</p>
                      </div>
                      <div className="bg-background rounded-xl p-4 border text-left">
                        <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                        <p className="text-2xl font-bold text-amber-500">87%</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-8 bg-muted p-3 rounded-lg text-left">
                      <strong>Disclaimer:</strong> This is an AI estimated value. The final trade-in valuation will be generated after physical inspection by a dealership executive.
                    </p>
                    
                    <Button className="w-full mt-4" variant="outline">
                      Transfer Value to New Booking
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
