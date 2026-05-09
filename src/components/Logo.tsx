import logo from "@/assets/forbin-logo.png";

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="FORBIN"
        width={size}
        height={size}
        className="rounded-full ring-1 ring-primary/40"
      />
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          FORBIN
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          MultiEmpresas
        </span>
      </div>
    </div>
  );
}
