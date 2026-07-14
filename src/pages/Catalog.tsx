import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Loader2, ArrowRight, Gauge, Settings2, ShieldCheck, Tag } from "lucide-react";
import { useMutation } from "convex/react";

export default function Catalog() {
  const vehicles = useQuery(api.catalog.getVehicles, {});
  const createEnquiry = useMutation(api.workflow.createEnquiry);
  
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isEnquiring, setIsEnquiring] = useState(false);

  const handleEnquire = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    
    setIsEnquiring(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createEnquiry({
        customerName: formData.get("name") as string,
        phone: formData.get("phone") as string,
        carType: selectedVehicle.category,
        carModel: selectedVehicle.model,
        amount: selectedVehicle.startingPrice,
      });
      alert("Enquiry submitted successfully! An executive will contact you shortly.");
      setSelectedVehicle(null);
    } catch (error: any) {
      alert(`Failed to submit enquiry: ${error.message}`);
    } finally {
      setIsEnquiring(false);
    }
  };

  if (vehicles === undefined) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 text-amber-500 border-amber-500/30 bg-amber-500/5">
            <Car className="h-3 w-3 mr-2" />
            Vehicle Catalog
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Drive</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse our premium selection of vehicles, explore specifications, and schedule a test drive today.
          </p>
        </div>

        {/* Filters placeholder */}
        <div className="flex items-center gap-4 mb-8 pb-4 border-b overflow-x-auto">
          <Button variant="secondary" className="rounded-full">All Models</Button>
          <Button variant="ghost" className="rounded-full">SUVs</Button>
          <Button variant="ghost" className="rounded-full">Sedans</Button>
          <Button variant="ghost" className="rounded-full">Electric</Button>
          <Button variant="ghost" className="rounded-full">Luxury</Button>
        </div>

        {/* Vehicles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p>No vehicles found in the catalog.</p>
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <Card key={vehicle._id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 bg-card/40 backdrop-blur-sm">
                <div className="aspect-[16/10] relative bg-secondary/30 overflow-hidden">
                  {vehicle.thumbnailUrl ? (
                    <img 
                      src={vehicle.thumbnailUrl} 
                      alt={vehicle.model}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  {vehicle.isPopular && (
                    <Badge className="absolute top-4 left-4 bg-orange-500 hover:bg-orange-600 border-none text-white">
                      Best Seller
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{vehicle.brand}</p>
                      <CardTitle className="text-2xl mt-1">{vehicle.model}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Starts at</p>
                      <p className="text-lg font-bold text-amber-500">₹{(vehicle.startingPrice / 100000).toFixed(2)}L</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/40 text-center">
                      <Gauge className="h-4 w-4 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium">18 kmpl</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/40 text-center">
                      <Settings2 className="h-4 w-4 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium">Auto</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/40 text-center">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium">5 Star</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 gap-3">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                  
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white" onClick={() => setSelectedVehicle(vehicle)}>
                    Book Test Drive
                  </Button>
                  
                  <Dialog open={selectedVehicle?._id === vehicle._id} onOpenChange={(open) => !open && setSelectedVehicle(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enquire About {vehicle.model}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleEnquire} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" name="name" required placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" name="phone" required placeholder="+91 98765 43210" />
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600" disabled={isEnquiring}>
                          {isEnquiring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                          Submit Enquiry
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
