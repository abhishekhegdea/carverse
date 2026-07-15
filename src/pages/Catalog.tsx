import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Loader2, Gauge, Settings2, ShieldCheck, Tag, Info, Fuel, Calendar, MapPin, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};
export default function Catalog() {
  const vehicles = useQuery(api.catalog.getVehicles, {});
  const createEnquiry = useMutation(api.workflow.createEnquiry);
  
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [detailsVehicle, setDetailsVehicle] = useState<any>(null);
  const [isEnquiring, setIsEnquiring] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All Models");

  // Filter vehicles based on active category
  const filteredVehicles = vehicles?.filter(v => {
    if (activeCategory === "All Models") return true;
    if (activeCategory === "Electric") return v.category === "electric";
    if (activeCategory === "SUVs") return v.category === "suv";
    if (activeCategory === "Sedans") return v.category === "sedan" || v.category === "passenger";
    if (activeCategory === "Luxury") return v.category === "luxury";
    return true;
  }) || [];

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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5 px-4 py-1.5 rounded-full">
            <Car className="h-4 w-4 mr-2" />
            Vehicle Catalog
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Find Your Perfect <span className="text-gradient">Drive</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Browse our premium selection of vehicles, explore specifications, and schedule a test drive today.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-4 mb-8 pb-4 overflow-x-auto"
        >
          {["All Models", "SUVs", "Sedans", "Electric", "Luxury"].map((cat) => (
            <Button 
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"} 
              className={`rounded-full px-6 transition-all duration-300 ${activeCategory === cat ? 'shadow-lg shadow-primary/20' : 'hover:bg-white/5 border-border/50'}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </motion.div>

        {/* Vehicles Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p>No vehicles found in the catalog.</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <motion.div key={vehicle._id} variants={itemVariants}>
                <Card className="overflow-hidden group glass-card">
                  <div className="aspect-[16/10] relative bg-secondary/10 overflow-hidden rounded-t-xl">
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
                      <p className="text-xl font-bold text-gradient">₹{(vehicle.startingPrice / 100000).toFixed(2)}L</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Dynamic stats based on category */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/40 text-center">
                      <Gauge className="h-4 w-4 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium">
                        {vehicle.category === "electric" ? "450 km" : 
                         vehicle.category === "suv" ? "14 kmpl" : 
                         vehicle.category === "luxury" ? "12 kmpl" : "18 kmpl"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/40 text-center">
                      <Settings2 className="h-4 w-4 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium">
                        {vehicle.category === "electric" ? "Direct" : "Auto"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/40 text-center">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium">5 Star</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 gap-3">
                  <Button variant="outline" className="w-full" onClick={() => setDetailsVehicle(vehicle)}>
                    View Details
                  </Button>
                  
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all" onClick={() => setSelectedVehicle(vehicle)}>
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
                        <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={isEnquiring}>
                          {isEnquiring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                          Submit Enquiry
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Details Dialog */}
                  <Dialog open={detailsVehicle?._id === vehicle._id} onOpenChange={(open) => !open && setDetailsVehicle(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">{vehicle.brand} {vehicle.model}</DialogTitle>
                        <DialogDescription>
                          Starting at ₹{(vehicle.startingPrice / 100000).toFixed(2)}L
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4 space-y-6">
                        {vehicle.thumbnailUrl && (
                          <div className="w-full h-64 rounded-xl overflow-hidden bg-secondary/20">
                            <img 
                              src={vehicle.thumbnailUrl} 
                              alt={vehicle.model}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Overview</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {vehicle.description || `The ${vehicle.brand} ${vehicle.model} is a premium ${vehicle.category} vehicle offering top-tier performance, advanced safety features, and incredible comfort. Designed for the modern driver, it combines elegance with cutting-edge technology.`}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/20">
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground uppercase">Type</span>
                            <span className="text-sm font-semibold capitalize">{vehicle.category}</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/20">
                            <Settings2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground uppercase">Trans.</span>
                            <span className="text-sm font-semibold">{vehicle.category === "electric" ? "Direct" : "Automatic"}</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/20">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground uppercase">Range/Fuel</span>
                            <span className="text-sm font-semibold">{vehicle.category === "electric" ? "450 km" : "16 kmpl"}</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/20">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground uppercase">Availability</span>
                            <span className="text-sm font-semibold text-emerald-500">In Stock</span>
                          </div>
                        </div>
                        <div className="flex justify-end pt-4 gap-3">
                          <Button variant="outline" onClick={() => setDetailsVehicle(null)}>Close</Button>
                          <Button className="shadow-lg shadow-primary/20" onClick={() => {
                            setDetailsVehicle(null);
                            setSelectedVehicle(vehicle);
                          }}>
                            Book Test Drive
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
