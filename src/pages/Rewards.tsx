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
  { label: "Double XP", color: "from-amber-400 to-amber-500", icon: Zap },
  { label: "50 XP Bonus", color: "from-emerald-400 to-emerald-500", icon: Zap },
  { label: "100 XP Bonus", color: "from-blue-400 to-blue-500", icon: Zap },
  { label: "Lucky Badge", color: "from-violet-400 to-violet-500", icon: Gift },
  { label: "Extra Leave", color: "from-rose-400 to-rose-500", icon: Heart },
  { label: "Fuel Voucher", color: "from-orange-400 to-orange-500", icon: Fuel },
  { label: "Lunch Coupon", color: "from-cyan-400 to-cyan-500", icon: Coffee },
  { label: "No Luck", color: "from-slate-400 to-slate-500", icon: RotateCcw },
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Spin Wheel
              </CardTitle>
              <CardDescription>Unlock every 1,000 XP for a spin!</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4">
                <div
                  className="w-full h-full rounded-full border-4 border-secondary flex items-center justify-center relative overflow-hidden transition-transform duration-1000 ease-out"
                  style={{ transform: `rotate(${spinRotation}deg)` }}
                >
                  {SPIN_SECTORS.map((sector, i) => {
                    const angle = (360 / SPIN_SECTORS.length) * i;
                    return (
                      <div
                        key={sector.label}
                        className="absolute inset-0"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 22.5) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 22.5) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + 22.5) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle + 22.5) * Math.PI / 180)}%)`,
                          background: `linear-gradient(135deg, ${sector.color.replace("from-", "").replace(" to-", " ").split(" ")[0]} 0%, ${sector.color.replace("from-", "").replace(" to-", " ").split(" ")[2]} 100%)`,
                        }}
                      />
                    );
                  })}
                  <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center z-10">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4 bg-destructive rotate-45 z-20" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cost: <span className="font-semibold text-foreground">1,000 XP</span> per spin</p>
                {spinResult && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm font-semibold">{spinResult.reward}</p>
                    {spinResult.type !== "none" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {spinResult.xpAmount ? `+${spinResult.xpAmount} XP bonus!` :
                         spinResult.multiplier ? `${spinResult.multiplier}x multiplier on next earning!` : "Check your rewards!"}
                      </p>
                    )}
                  </div>
                )}
                <Button className="w-full" disabled={isSpinning || userXP < 1000} onClick={handleSpin}>
                  {isSpinning ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Spinning...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Spin for 1,000 XP</>
                  )}
                </Button>
                {userXP < 1000 && <p className="text-xs text-muted-foreground">Need {1000 - userXP} more XP to spin</p>}
              </div>
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
