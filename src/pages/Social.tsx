import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "@/hooks/use-convex-auth";;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Heart, MessageCircle, Share2, Rss, ThumbsUp,
  Award, Zap, Trophy, Star, Sparkles, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const TYPE_ICONS: Record<string, any> = {
  xp_milestone: Zap,
  badge_earned: Award,
  level_up: Trophy,
  achievement: Star,
  sale_closed: Sparkles,
  birthday: Heart,
  promotion: Award,
  announcement: Rss,
  appreciation: Heart,
};

const TYPE_COLORS: Record<string, string> = {
  xp_milestone: "text-amber-500 bg-amber-500/10",
  badge_earned: "text-violet-500 bg-violet-500/10",
  level_up: "text-emerald-500 bg-emerald-500/10",
  achievement: "text-blue-500 bg-blue-500/10",
  sale_closed: "text-green-500 bg-green-500/10",
  birthday: "text-rose-500 bg-rose-500/10",
  promotion: "text-indigo-500 bg-indigo-500/10",
  announcement: "text-orange-500 bg-orange-500/10",
  appreciation: "text-pink-500 bg-pink-500/10",
};

function ActivityCard({ activity, onLike, onComment, currentUserId }: {
  activity: any; onLike: () => void; onComment: (text: string) => void; currentUserId: string | undefined;
}) {
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState("");

  const Icon = TYPE_ICONS[activity.type] ?? Rss;
  const colorClass = TYPE_COLORS[activity.type] ?? "text-muted-foreground bg-secondary";
  const isLiked = activity.likes?.includes(currentUserId);
  const likesCount = activity.likes?.length ?? 0;
  const commentsCount = activity.comments?.length ?? 0;

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onComment(commentText.trim());
      setCommentText("");
      setShowComment(false);
    }
  };

  return (
    <Card className="card-hover">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={activity.employee?.image} />
            <AvatarFallback className="text-xs bg-secondary">
              {activity.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{activity.employee?.name ?? "Someone"}</span>
              <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", colorClass)}>
                <Icon className="h-3 w-3" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{activity.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(activity.createdAt).toLocaleDateString()} · {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 border-t border-border/40 pt-3 mt-3">
          <button
            onClick={onLike}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
            )}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
            <span>{likesCount}</span>
          </button>
          <button
            onClick={() => setShowComment(!showComment)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{commentsCount}</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Comments */}
        {activity.comments && activity.comments.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
            {activity.comments.slice(0, 3).map((comment: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] font-medium">U</span>
                </div>
                <div>
                  <p className="text-xs">{comment.text}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        {showComment && (
          <div className="mt-3 flex items-center gap-2">
            <Textarea
              placeholder="Write a comment..."
              className="min-h-0 h-8 text-xs py-1.5 flex-1"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitComment()}
            />
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleSubmitComment}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Social() {
  const { user } = useAuth();
  const activities = useQuery(api.notifications.getActivityFeed, { limit: 30 });
  const likeActivity = useMutation(api.notifications.likeActivity);
  const commentActivity = useMutation(api.notifications.commentOnActivity);

  const isLoading = !activities;

  const handleLike = async (activityId: string) => {
    try {
      await likeActivity({ activityId: activityId as any });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleComment = async (activityId: string, text: string) => {
    try {
      await commentActivity({ activityId: activityId as any, text });
      toast.success("Comment added");
    } catch (err) {
      toast.error("Failed to add comment");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Social Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">Stay connected with your team's achievements</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity: any) => (
            <ActivityCard
              key={activity._id}
              activity={activity}
              onLike={() => handleLike(activity._id)}
              onComment={(text) => handleComment(activity._id, text)}
              currentUserId={user?._id}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Rss className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No activities yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
