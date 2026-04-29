import { useState, useEffect } from "react";
import { Star, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useUserReputation, useUserReviews, useMyReviewFor, useReviewMutations,
} from "@/hooks/useReputation";

const StarRow = ({
  value, onChange, size = 18, readOnly = false,
}: { value: number; onChange?: (n: number) => void; size?: number; readOnly?: boolean }) => (
  <div className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        disabled={readOnly}
        onClick={() => onChange?.(n)}
        className={cn(
          "transition-transform",
          !readOnly && "hover:scale-110 cursor-pointer",
          readOnly && "cursor-default"
        )}
      >
        <Star
          style={{ width: size, height: size }}
          className={cn(
            "transition-colors",
            n <= value
              ? "fill-warning text-warning"
              : "text-muted-foreground/40"
          )}
        />
      </button>
    ))}
  </div>
);

interface Props {
  profileUserId: string;
  isOwnProfile: boolean;
}

export default function ReputationPanel({ profileUserId, isOwnProfile }: Props) {
  const { user } = useAuth();
  const { data: rep, isLoading: repLoading } = useUserReputation(profileUserId);
  const { data: reviews, isLoading: reviewsLoading } = useUserReviews(profileUserId);
  const { data: myReview } = useMyReviewFor(profileUserId);
  const { upsert, remove } = useReviewMutations(profileUserId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || "");
    }
  }, [myReview]);

  const canReview = !!user && !isOwnProfile;
  const avg = Number(rep?.avg ?? 0);
  const count = Number(rep?.count ?? 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-warning leading-none tabular-nums">
                {repLoading ? "—" : avg.toFixed(1)}
              </div>
              <div className="mt-1.5">
                <StarRow value={Math.round(avg)} readOnly size={14} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {count} {count === 1 ? "avaliação" : "avaliações"}
              </p>
            </div>
          </div>
          <div className="flex-1 text-xs text-muted-foreground sm:border-l sm:border-border sm:pl-5">
            <p className="font-semibold text-foreground mb-1 text-sm">Reputação</p>
            <p className="leading-relaxed">
              Quanto mais avaliações positivas, mais confiável é o usuário. As avaliações são feitas
              manualmente por quem já negociou.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      {canReview && (
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              {myReview ? "Sua avaliação" : "Deixe sua avaliação"}
            </h3>
            <StarRow value={rating} onChange={setRating} />
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi sua experiência com este usuário (opcional)"
            className="bg-secondary/50 border-border min-h-[72px] resize-none text-sm"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => upsert.mutate({ rating, comment })}
              disabled={rating < 1 || upsert.isPending}
              className="bg-primary text-primary-foreground"
            >
              {myReview ? "Atualizar" : "Publicar avaliação"}
            </Button>
            {myReview && (
              <Button
                size="sm" variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm("Remover sua avaliação?")) remove.mutate(myReview.id);
                }}
                disabled={remove.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
              </Button>
            )}
          </div>
        </div>
      )}

      {!user && !isOwnProfile && (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Faça login</Link> para avaliar este usuário.
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Avaliações recebidas
        </h3>
        {reviewsLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : reviews && reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  {r.reviewer_profile?.avatar_url && <AvatarImage src={r.reviewer_profile.avatar_url} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(r.reviewer_profile?.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link
                      to={`/perfil/${r.reviewer_id}`}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {r.reviewer_profile?.username || "Usuário"}
                    </Link>
                    <StarRow value={r.rating} readOnly size={13} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                  {r.comment && (
                    <p className="mt-2 text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center">
            <Star className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma avaliação ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
