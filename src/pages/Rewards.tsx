import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Gift, ShoppingBag, Zap, Ticket, Film, Coffee,
  Car, GraduationCap, Fuel, Heart, RotateCcw,
  Sparkles, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const CATEGORY_MAP: Record<string, { icon: any; color: string }> = {
  voucher: { icon: Ticket, color: "text-emerald-500" },
  fuel: { icon: Fuel, color: "text-amber-500" },
  entertainment: { icon: Film, color: "text-violet-500" },
  leave: { icon: Heart, color: "text-rose-500" },
  food: { icon: Coffee, color: "text-orange-500" },
  accessories: { icon: Car, color: "text-blue-500" },
  training: { icon: GraduationCap, color: "text-indigo-500" },
};

function RewardCard({ reward, canAfford, onRedeem, redeeming }: {
  reward: any; canAfford: boolean; onRedeem: () => void; redeeming: boolean;
}) {
  const cat = CATEGORY_MAP[reward.category as keyof typeof CATEGORY_MAP] ?? { icon: Gift, color: "text-muted-foreground" };
  const Icon = cat.icon;

  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={cn("h-10 w-10 rounded-xl bg-secondary flex items-center justify-center", cat.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{reward.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{reward.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="font-semibold">{reward.xpCost.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">XP</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">{reward.stock} left</Badge>
        </div>
        <Button
          className="w-full mt-3"
          size="sm"
          disabled={!canAfford || reward.stock <= 0 || redeeming}
          onClick={onRedeem}
        >
          {redeeming ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : canAfford ? (
            "Redeem"
          ) : (
            "Need more XP"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

const SPIN_SECTORS = [
  { label: "Mystery Chest", bg: "#06b6d4", color: "text-slate-900" },
  { label: "No luck", bg: "#334155", color: "text-white" },
  { label: "-20% XP", bg: "#ef4444", color: "text-white" },
  { label: "2x XP Boost", bg: "#ea580c", color: "text-white" },
  { label: "5x XP Boost", bg: "#f59e0b", color: "text-slate-900" },
  { label: "JACKPOT!", bg: "#eab308", color: "text-slate-900" },
  { label: "Coupon Drop", bg: "#3b82f6", color: "text-white" },
  { label: "Badge Unlock", bg: "#a855f7", color: "text-white" },
];

export default function Rewards() {
  const { user } = useAuth();
  const rewardsData = useQuery(api.rewards.getRewards, {});
  const myRedemptions = useQuery(api.rewards.getMyRedemptions, {});
  const spinHistory = useQuery(api.rewards.getSpinHistory, {});
  const redeemReward = useMutation(api.rewards.redeemReward);
  const performSpin = useMutation(api.rewards.performSpin);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [spinRotation, setSpinRotation] = useState(0);

  const isLoading = !rewardsData;
  const userXP = rewardsData?.userXP ?? user?.totalXP ?? 0;
  const lastFreeSpinAt = rewardsData?.lastFreeSpinAt ?? 0;
  const isFreeSpinAvailable = Date.now() - lastFreeSpinAt >= 24 * 60 * 60 * 1000;
  const rewards = rewardsData?.rewards ?? [];

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    try {
      const result = await redeemReward({ rewardId: rewardId as any });
      toast.success(`Redeemed successfully! Spent ${result.xpSpent} XP`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to redeem");
    }
    setRedeemingId(null);
  };

  const handleSpin = async () => {
    setIsSpinning(true);
    setSpinResult(null);

    const spins = 5 + Math.floor(Math.random() * 3);
    setSpinRotation(prev => prev + spins * 360);

    try {
      const result = await performSpin();
      setTimeout(() => {
        setSpinResult(result);
        toast.success(`You won: ${result.reward}!`);
        setIsSpinning(false);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to spin");
      setIsSpinning(false);
    }
  };

  const categories = [...new Set(rewards.map((r: any) => r.category))];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rewards Store</h1>
          <p className="text-sm text-muted-foreground mt-1">Redeem your XP for exciting rewards</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="font-semibold">{userXP.toLocaleString()} XP</span>
          <span className="text-muted-foreground">available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="w-full sm:w-auto flex-wrap h-auto">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                {categories.map((cat: string) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs capitalize">{cat}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rewards.map((reward: any) => (
                    <RewardCard
                      key={reward._id}
                      reward={reward}
                      canAfford={userXP >= reward.xpCost}
                      onRedeem={() => handleRedeem(reward._id)}
                      redeeming={redeemingId === reward._id}
                    />
                  ))}
                </div>
              </TabsContent>

              {categories.map((cat: string) => (
                <TabsContent key={cat} value={cat} className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rewards.filter((r: any) => r.category === cat).map((reward: any) => (
                      <RewardCard
                        key={reward._id}
                        reward={reward}
                        canAfford={userXP >= reward.xpCost}
                        onRedeem={() => handleRedeem(reward._id)}
                        redeeming={redeemingId === reward._id}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {myRedemptions && myRedemptions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Redemption History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myRedemptions.slice(0, 10).map((r: any) => (
                    <div key={r._id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{r.reward?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.redeemedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">-{r.xpSpent} XP</span>
                        <Badge variant="secondary" className="text-[10px] capitalize">{r.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Lucky Spin</h2>
              <p className="text-sm text-muted-foreground mt-1">One free spin every 24h. Extra spins cost 200 XP. Outcomes range from jackpot to -20% XP.</p>
            </div>
            
            <Card className="bg-[#1a1a1a] border-none shadow-xl pt-10 pb-6">
              <CardContent className="text-center relative">
                
                {/* Wheel Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-6 h-6 bg-[#eab308] rotate-45 z-20 rounded-sm" />
                
                {/* The Wheel */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto mb-8">
                  <div
                    className="w-full h-full rounded-full border-4 border-[#1a1a1a] shadow-2xl relative overflow-hidden transition-transform duration-[3000ms] ease-[cubic-bezier(0.1,0.7,0.1,1)]"
                    style={{ 
                      transform: `rotate(${spinRotation}deg)`,
                      background: `conic-gradient(
                        #06b6d4 0deg 45deg,
                        #334155 45deg 90deg,
                        #ef4444 90deg 135deg,
                        #ea580c 135deg 180deg,
                        #f59e0b 180deg 225deg,
                        #eab308 225deg 270deg,
                        #3b82f6 270deg 315deg,
                        #a855f7 315deg 360deg
                      )`
                    }}
                  >
                    {/* Wheel Lines (separators) */}
                    {SPIN_SECTORS.map((_, i) => (
                      <div
                        key={`line-${i}`}
                        className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-[#1a1a1a] origin-bottom z-10"
                        style={{ transform: `rotate(${i * 45}deg)` }}
                      />
                    ))}
                    
                    {/* Wheel Text */}
                    {SPIN_SECTORS.map((sector, i) => {
                      const angle = (360 / SPIN_SECTORS.length) * i + 22.5;
                      return (
                        <div
                          key={sector.label}
                          className={cn("absolute inset-0 flex flex-col justify-start items-center pt-8 z-10", sector.color)}
                          style={{
                            transform: `rotate(${angle}deg)`,
                          }}
                        >
                          <span className="text-[11px] sm:text-sm font-bold tracking-wider uppercase -rotate-90 origin-bottom mt-10 whitespace-nowrap">
                            {sector.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#111] border-[6px] border-[#ea580c] z-20 shadow-inner" />
                </div>

                {spinResult && (
                  <div className="mb-6 p-3 rounded-lg bg-secondary/30 max-w-[250px] mx-auto border border-border/20">
                    <p className="text-sm font-semibold">{spinResult.reward}</p>
                    {spinResult.type !== "none" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {spinResult.xpAmount ? `+${spinResult.xpAmount} XP bonus!` :
                         spinResult.multiplier ? `${spinResult.multiplier}x multiplier on next earning!` : "Check your rewards!"}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  <Button 
                    className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold tracking-wider px-6 rounded-md border-b-4 border-[#c2410c] active:border-b-0 active:mt-1 transition-all" 
                    disabled={isSpinning || !isFreeSpinAvailable} 
                    onClick={handleSpin}
                  >
                    {isFreeSpinAvailable ? "FREE SPIN" : "FREE SPIN USED"}
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#f97316]/30 text-[#f97316] hover:bg-[#f97316]/10 font-bold tracking-wider px-6 rounded-md" 
                    disabled={isSpinning || userXP < 200 || isFreeSpinAvailable} 
                    onClick={handleSpin}
                  >
                    EXTRA SPIN · 200 XP
                  </Button>
                </div>
                {!isFreeSpinAvailable && userXP < 200 && <p className="text-xs text-muted-foreground mt-3">Need {200 - userXP} more XP to spin</p>}
              </CardContent>
            </Card>

          {spinHistory && spinHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Spins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {spinHistory.slice(0, 5).map((spin: any) => (
                  <div key={spin._id} className="flex items-center justify-between text-sm">
                    <span>{spin.reward}</span>
                    <span className="text-xs text-muted-foreground">-{spin.xpCost} XP</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
