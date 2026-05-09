import { ExternalLink } from "lucide-react";
import adForbin from "@/assets/ad-forbin-academy.jpg";
import adTactical from "@/assets/ad-tactical-gear.jpg";
import adSegurplan from "@/assets/ad-segurplan.jpg";
import adCftv from "@/assets/ad-cftv-pro.jpg";

export type Ad = {
  id: string;
  sponsor: string;
  image: string;
  href: string;
};

export const ADS: Ad[] = [
  {
    id: "ad-1",
    sponsor: "Forbin Academy",
    image: adForbin,
    href: "https://forbinacademy.com.br",
  },
  {
    id: "ad-2",
    sponsor: "Tactical Gear BR",
    image: adTactical,
    href: "https://tacticalgear.com.br",
  },
  {
    id: "ad-3",
    sponsor: "SegurPlan Saúde",
    image: adSegurplan,
    href: "https://segurplan.com.br",
  },
  {
    id: "ad-4",
    sponsor: "CFTV Pro Cursos",
    image: adCftv,
    href: "https://cftvpro.com.br",
  },
];

export function AdBanner({ ad, className = "" }: { ad: Ad; className?: string }) {
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="truncate">Patrocinado · {ad.sponsor}</span>
        <span className="text-primary">Ad</span>
      </div>
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/60 hover:shadow-gold"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
          <img
            src={ad.image}
            alt={`Anúncio ${ad.sponsor}`}
            width={800}
            height={1000}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-card/80 px-4 py-3 backdrop-blur">
          <span className="truncate text-sm font-semibold text-foreground">
            {ad.sponsor}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition group-hover:bg-primary/90">
            Acessar <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </a>
    </div>
  );
}
