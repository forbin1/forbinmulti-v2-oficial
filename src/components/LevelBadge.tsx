import { Medal, Gem, Shield, type LucideIcon } from "lucide-react";
import { LEVEL_META, type LevelTier } from "@/lib/professional-level";
import { cn } from "@/lib/utils";

type LevelStyle = {
  Icon: LucideIcon;
  /** Gradiente metálico do medalhão. */
  medallion: string;
  /** Cor da borda do selo. */
  ring: string;
  /** Cor do texto do nível. */
  text: string;
  /** Cor do ícone sobre o medalhão. */
  iconColor: string;
  /** Brilho externo sutil. */
  glow: string;
};

const STYLES: Record<LevelTier, LevelStyle> = {
  diamante: {
    Icon: Gem,
    medallion: "linear-gradient(140deg, #E0F7FF 0%, #7DD3FC 45%, #4F86E8 100%)",
    ring: "rgba(125, 211, 252, 0.55)",
    text: "#CDEBFB",
    iconColor: "rgba(8, 30, 54, 0.78)",
    glow: "0 0 14px rgba(56, 189, 248, 0.28)",
  },
  ouro: {
    Icon: Medal,
    medallion: "linear-gradient(140deg, #FBE7A8 0%, #E6C158 45%, #B8860B 100%)",
    ring: "rgba(230, 193, 88, 0.55)",
    text: "#F2DC97",
    iconColor: "rgba(60, 40, 0, 0.72)",
    glow: "0 0 14px rgba(212, 175, 55, 0.25)",
  },
  prata: {
    Icon: Medal,
    medallion: "linear-gradient(140deg, #F4F7FA 0%, #C4CDD8 45%, #8B97A6 100%)",
    ring: "rgba(196, 205, 216, 0.5)",
    text: "#E4E9EF",
    iconColor: "rgba(40, 48, 58, 0.7)",
    glow: "0 0 12px rgba(203, 213, 225, 0.18)",
  },
  bronze: {
    Icon: Medal,
    medallion: "linear-gradient(140deg, #E6A877 0%, #C57E4E 45%, #7E4423 100%)",
    ring: "rgba(197, 126, 78, 0.5)",
    text: "#E7B996",
    iconColor: "rgba(248, 236, 228, 0.92)",
    glow: "0 0 12px rgba(197, 126, 78, 0.2)",
  },
  none: {
    Icon: Shield,
    medallion: "linear-gradient(140deg, #5b6472 0%, #3c424d 100%)",
    ring: "rgba(148, 163, 184, 0.3)",
    text: "#9aa3b2",
    iconColor: "rgba(226, 232, 240, 0.85)",
    glow: "none",
  },
};

const SIZES = {
  sm: { medallion: "h-5 w-5", icon: "h-2.5 w-2.5", text: "text-[10px]", pad: "pl-1 pr-2 py-0.5 gap-1.5" },
  md: { medallion: "h-6 w-6", icon: "h-3.5 w-3.5", text: "text-[11px]", pad: "pl-1 pr-2.5 py-1 gap-1.5" },
  lg: { medallion: "h-8 w-8", icon: "h-4 w-4", text: "text-sm", pad: "pl-1.5 pr-3.5 py-1.5 gap-2" },
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
  const s = STYLES[tier];
  const sz = SIZES[size];
  const Icon = s.Icon;

  const Medallion = (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full", sz.medallion)}
      style={{
        background: s.medallion,
        boxShadow: `${s.glow}, inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.28)`,
      }}
    >
      <Icon className={sz.icon} strokeWidth={2.4} style={{ color: s.iconColor }} />
    </span>
  );

  // Modo compacto: apenas o medalhão (usado em cards de listagem).
  if (!showLabel) {
    if (tier === "none") return null;
    return (
      <span title={`Nível ${meta.label} — ${meta.description}`} className={cn("inline-flex", className)}>
        {Medallion}
      </span>
    );
  }

  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex items-center rounded-full border backdrop-blur-sm",
        sz.pad,
        sz.text,
        className,
      )}
      style={{
        borderColor: s.ring,
        background: "rgba(15, 18, 24, 0.55)",
      }}
    >
      {Medallion}
      <span className="font-semibold uppercase tracking-[0.14em]" style={{ color: s.text }}>
        {meta.label}
      </span>
    </span>
  );
}
