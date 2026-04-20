import { useUserBadges, useBadgeMutations, type BadgeType } from "@/hooks/useUserBadges";
import { BadgeCheck, Award, Crown, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserBadgeControlsProps {
  userId: string;
}

const OPTIONS: { type: Exclude<BadgeType, "custom">; label: string; Icon: typeof BadgeCheck; activeCls: string }[] = [
  { type: "premium_verified", label: "Premium", Icon: BadgeCheck, activeCls: "bg-primary text-primary-foreground border-primary" },
  { type: "trusted_trader", label: "Confiável", Icon: Award, activeCls: "bg-primary/80 text-primary-foreground border-primary/80" },
  { type: "top_trader", label: "Top", Icon: Crown, activeCls: "bg-warning text-warning-foreground border-warning" },
  { type: "veteran", label: "Veterano", Icon: Gem, activeCls: "bg-secondary text-foreground border-foreground/40" },
];

const UserBadgeControls = ({ userId }: UserBadgeControlsProps) => {
  const { data: badges = [] } = useUserBadges(userId);
  const { grant, revoke } = useBadgeMutations();
  const pending = grant.isPending || revoke.isPending;

  const has = (t: BadgeType) => badges.some((b) => b.badge_type === t);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {OPTIONS.map(({ type, label, Icon, activeCls }) => {
        const active = has(type);
        return (
          <button
            key={type}
            type="button"
            disabled={pending}
            onClick={() => {
              if (active) revoke.mutate({ user_id: userId, badge_type: type });
              else grant.mutate({ user_id: userId, badge_type: type });
            }}
            title={active ? `Remover ${label}` : `Conceder ${label}`}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 h-6 rounded-md border text-[10px] font-semibold transition-colors disabled:opacity-50",
              active ? activeCls : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default UserBadgeControls;
