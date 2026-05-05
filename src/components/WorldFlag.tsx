import { getWorldFlag, type WorldFlagInput } from "@/lib/world-flags";
import { cn } from "@/lib/utils";

interface Props {
  world?: WorldFlagInput | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { box: "h-3.5 w-5", text: "text-xs" },
  sm: { box: "h-4 w-6", text: "text-sm" },
  md: { box: "h-5 w-7", text: "text-lg" },
  lg: { box: "h-7 w-10", text: "text-2xl" },
};

export default function WorldFlag({ world, size = "sm", className }: Props) {
  const flag = getWorldFlag(world);
  const s = SIZES[size];
  if (flag.url) {
    return (
      <img
        src={flag.url}
        alt="flag"
        className={cn(s.box, "object-cover rounded-sm border border-border/40", className)}
      />
    );
  }
  return (
    <span className={cn(s.text, "leading-none select-none", className)} aria-hidden>
      {flag.emoji}
    </span>
  );
}
