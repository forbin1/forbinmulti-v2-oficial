import { LEVEL_META, type LevelTier } from "@/lib/professional-level";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-3 py-1 text-xs gap-1.5",
  lg: "px-4 py-1.5 text-sm gap-2",
} as const;

export function LevelBadge({
  tier,
  size = "md",
  showLabel = true,
  className,
}: {
  tier: LevelTier;
  size?: keyof typeof SIZES;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = LEVEL_META[tier];
  if (tier === "none" && !showLabel) return null;

  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex items-center rounded-full border font-bold uppercase tracking-wide",
        meta.className,
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
