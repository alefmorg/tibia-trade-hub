import { BadgeCheck, Award, Crown, Gem, Shield, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserBadge, BadgeType } from "@/hooks/useUserBadges";

interface BadgeMeta {
  label: string;
  Icon: typeof BadgeCheck;
  className: string;
  title: string;
}

const META: Record<Exclude<BadgeType, "custom">, BadgeMeta> = {
  premium_verified: {
    label: "Premium",
    Icon: BadgeCheck,
    className: "bg-primary/15 text-primary border-primary/40",
    title: "Conta Premium verificada",
  },
  trusted_trader: {
    label: "Vendedor confiável",
    Icon: Award,
    className: "bg-primary/10 text-primary border-primary/25",
    title: "Vendedor confiável",
  },
  top_trader: {
    label: "Top Trader",
    Icon: Crown,
    className: "bg-warning/15 text-warning border-warning/35",
    title: "Top Trader da comunidade",
  },
  veteran: {
    label: "Veterano",
    Icon: Gem,
    className: "bg-secondary text-foreground border-border",
    title: "Membro veterano",
  },
};

interface UserBadgesProps {
  badges: UserBadge[];
  role?: string | null;
  size?: "sm" | "md";
  showRole?: boolean;
}

const UserBadges = ({ badges, role, size = "sm", showRole = true }: UserBadgesProps) => {
  const items: { key: string; node: React.ReactNode }[] = [];

  if (showRole && role === "admin") {
    items.push({
      key: "role-admin",
      node: (
        <span className={cn(pill(size), "bg-primary/15 text-primary border-primary/40")} title="Administrador">
          <Shield className={iconCls(size)} />
          Admin
        </span>
      ),
    });
  } else if (showRole && role === "moderator") {
    items.push({
      key: "role-mod",
      node: (
        <span className={cn(pill(size), "bg-warning/15 text-warning border-warning/40")} title="Moderador">
          <ShieldAlert className={iconCls(size)} />
          Mod
        </span>
      ),
    });
  }

  for (const b of badges) {
    if (b.badge_type === "custom") {
      const color = b.custom_color || "hsl(var(--primary))";
      items.push({
        key: b.id,
        node: (
          <span
            className={cn(pill(size), "border")}
            style={{ background: `${color}22`, color, borderColor: `${color}66` }}
            title={b.custom_label || "Selo"}
          >
            <Award className={iconCls(size)} />
            {b.custom_label || "Selo"}
          </span>
        ),
      });
    } else {
      const meta = META[b.badge_type];
      if (!meta) continue;
      const { Icon } = meta;
      items.push({
        key: b.id,
        node: (
          <span className={cn(pill(size), meta.className, "border")} title={meta.title}>
            <Icon className={iconCls(size)} />
            {meta.label}
          </span>
        ),
      });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((i) => <span key={i.key}>{i.node}</span>)}
    </div>
  );
};

const pill = (size: "sm" | "md") =>
  size === "md"
    ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
    : "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border";

const iconCls = (size: "sm" | "md") => (size === "md" ? "h-3.5 w-3.5" : "h-3 w-3");

export default UserBadges;
