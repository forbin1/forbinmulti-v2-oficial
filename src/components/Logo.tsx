import logo from "@/assets/forbin-logo.png";

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="FORBIN"
        width={size}
        height={size}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="rounded-full ring-1 ring-primary/40"
      />
      <div className="flex flex-col leading-none">
        <span className="whitespace-nowrap font-display text-base font-bold tracking-tight text-foreground sm:text-xl">
          GRUPO FORBIN
        </span>
      </div>
    </div>
  );
}
