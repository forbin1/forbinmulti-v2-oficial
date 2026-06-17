import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Mesmas dimensões do medalhão do LevelBadge, para alinhar com os selos de nível.
const SIZES = {
  sm: { medallion: "h-5 w-5", icon: "h-2.5 w-2.5" },
  md: { medallion: "h-6 w-6", icon: "h-3.5 w-3.5" },
  lg: { medallion: "h-8 w-8", icon: "h-4 w-4" },
} as const;

export function VerifiedBadge({
  size = "md",
  label = "Verificado",
  className,
}: {
  size?: keyof typeof SIZES;
  label?: string;
  className?: string;
}) {
  const sz = SIZES[size];
  return (
    <span
      title={label}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full", sz.medallion, className)}
      style={{
        background: "linear-gradient(140deg, #CDEBFB 0%, #38BDF8 45%, #2563EB 100%)",
        boxShadow:
          "0 0 12px rgba(56,189,248,0.28), inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.28)",
      }}
    >
      <ShieldCheck className={sz.icon} strokeWidth={2.6} style={{ color: "rgba(8,30,54,0.8)" }} />
    </span>
  );
}
