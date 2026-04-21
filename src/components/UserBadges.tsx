import { BadgeCheck, Award, Crown, Gem, Shield, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserBadge, BadgeType } from "@/hooks/useUserBadges";

/**
 * Selos no estilo pixel/Tibia:
 * - Tipografia pixel (Press Start 2P)
 * - Cantos retos (sem rounded-full)
 * - Borda dupla simulada (outline + inset)
 * - Sem gradientes brilhantes; cores chapadas do design system
 */

interface BadgeMeta {
  label: string;
  Icon: typeof BadgeCheck;
  tone: "primary" | "warning" | "muted";
  title: string;
}

const META: Record<Exclude<BadgeType, "custom">, BadgeMeta> = {
  premium_verified: { label: "PREMIUM",  Icon: BadgeCheck, tone: "primary", title: "Conta Premium verificada" },
  trusted_trader:   { label: "TRUSTED",  Icon: Award,      tone: "primary", title: "Vendedor confiável" },
  top_trader:       { label: "TOP",      Icon: Crown,      tone: "warning", title: "Top Trader da comunidade" },
  veteran:          { label: "VETERAN",  Icon: Gem,        tone: "muted",   title: "Membro veterano" },
};

interface UserBadgesProps {
  badges: UserBadge[];
  role?: string | null;
  size?: "sm" | "md";
  showRole?: boolean;
}

const toneStyle = (tone: "primary" | "warning" | "muted") => {
  switch (tone) {
    case "primary":
      return {
        bg: "hsl(var(--primary) / 0.12)",
        fg: "hsl(var(--primary))",
        border: "hsl(var(--primary) / 0.55)",
        outline: "hsl(var(--background))",
      };
    case "warning":
      return {
        bg: "hsl(var(--warning) / 0.14)",
        fg: "hsl(var(--warning))",
        border: "hsl(var(--warning) / 0.6)",
        outline: "hsl(var(--background))",
      };
    case "muted":
      return {
        bg: "hsl(var(--secondary))",
        fg: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        outline: "hsl(var(--background))",
      };
  }
};

const PixelPill = ({
  size,
  tone,
  Icon,
  label,
  title,
  customColor,
}: {
  size: "sm" | "md";
  tone: "primary" | "warning" | "muted";
  Icon: typeof BadgeCheck;
  label: string;
  title: string;
  customColor?: string;
}) => {
  const t = toneStyle(tone);
  const fg = customColor || t.fg;
  const border = customColor ? `${customColor}` : t.border;
  const bg = customColor ? `color-mix(in oklab, ${customColor} 14%, transparent)` : t.bg;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 font-pixel uppercase select-none",
        size === "md" ? "text-[9px] px-2.5 py-1.5" : "text-[8px] px-2 py-1"
      )}
      style={{
        color: fg,
        background: bg,
        border: `2px solid ${border}`,
        // borda dupla "pixel" (outline preto fino por fora)
        boxShadow: `0 0 0 1px ${t.outline}, inset 0 0 0 1px hsl(0 0% 0% / 0.35)`,
        borderRadius: 2,
        letterSpacing: "0.06em",
        textShadow: "1px 1px 0 hsl(0 0% 0% / 0.45)",
        imageRendering: "pixelated",
      }}
    >
      <Icon className={size === "md" ? "h-3 w-3" : "h-2.5 w-2.5"} strokeWidth={2.75} />
      {label}
    </span>
  );
};

const UserBadges = ({ badges, role, size = "sm", showRole = true }: UserBadgesProps) => {
  const items: { key: string; node: React.ReactNode }[] = [];

  if (showRole && role === "admin") {
    items.push({
      key: "role-admin",
      node: <PixelPill size={size} tone="primary" Icon={Shield} label="ADMIN" title="Administrador" />,
    });
  } else if (showRole && role === "moderator") {
    items.push({
      key: "role-mod",
      node: <PixelPill size={size} tone="warning" Icon={ShieldAlert} label="MOD" title="Moderador" />,
    });
  }

  for (const b of badges) {
    if (b.badge_type === "custom") {
      items.push({
        key: b.id,
        node: (
          <PixelPill
            size={size}
            tone="muted"
            Icon={Award}
            label={(b.custom_label || "SELO").toUpperCase()}
            title={b.custom_label || "Selo"}
            customColor={b.custom_color || undefined}
          />
        ),
      });
    } else {
      const meta = META[b.badge_type];
      if (!meta) continue;
      items.push({
        key: b.id,
        node: <PixelPill size={size} tone={meta.tone} Icon={meta.Icon} label={meta.label} title={meta.title} />,
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

export default UserBadges;
