import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, Fragment } from "react";
import { MapPin, Search, SlidersHorizontal, Briefcase, Building2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { JOBS, COURSES } from "@/data/mock";
import { ADS, AdBanner } from "@/components/AdBanner";
import { useAuth } from "@/hooks/use-auth";
import heroImage from "@/assets/vagas-hero.jpg";

export const Route = createFileRoute("/vagas/")({
  head: () => ({
    meta: [
      { title: "Vagas — FORBIN MultiEmpresas" },
      { name: "description", content: "Explore vagas de segurança privada por região, função e tipo de contratação." },
    ],
  }),
  component: VagasPage,
});

const REGIONS = ["Todas", "São Paulo", "Rio de Janeiro", "Minas Gerais", "Paraná", "Santa Catarina", "Distrito Federal"];
const TYPES = ["Todos", "CLT", "PJ", "Diária", "Temporário"] as const;

function VagasPage() {
  const { user, loading } = useAuth();
  const isLocked = !loading && !user;
  const [region, setRegion] = useState("Todas");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("Todos");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleSpecialty = (s: string) =>
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const filtered = JOBS.filter((j) => {
    const matchRegion = region === "Todas" || j.location.includes(region);
    const matchType = type === "Todos" || j.type === type;
    const matchQuery =
      j.title.toLowerCase().includes(query.toLowerCase()) ||
      j.company.toLowerCase().includes(query.toLowerCase());
    const matchSpec =
      specialties.length === 0 ||
      specialties.some((s) =>
        (j.title + " " + j.requirements.join(" ")).toLowerCase().includes(s.toLowerCase())
      );
    return matchRegion && matchType && matchQuery && matchSpec;
  });

  const activeFilters = (region !== "Todas" ? 1 : 0) + (type !== "Todos" ? 1 : 0) + specialties.length;

  return (
    <div>
      {/* Hero banner full width 1920x800 */}
      <section className="relative w-full overflow-hidden">
        <div className="relative aspect-[1920/800] max-h-[80vh] w-full">
          <img
            src={heroImage}
            alt="Vagas de segurança privada"
            className="h-full w-full object-cover"
            width={1920}
            height={800}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8 lg:pb-16">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">
                Vagas de Emprego
              </p>
              <h1 className="mt-2 max-w-2xl font-display text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-6xl">
                Encontre sua próxima vaga
              </h1>
              <p className="mt-2 max-w-xl text-xs text-white/80 sm:mt-3 sm:text-base">
                {JOBS.length} vagas ativas em todo o Brasil para profissionais de segurança privada.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search bar + Filtros */}
        <div className="mb-8 grid gap-3 rounded-3xl border border-border/60 bg-card p-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cargo, palavra-chave ou empresa…"
              className="h-14 rounded-2xl border-border/60 bg-surface pl-12 text-base"
            />
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button className="h-14 rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90">
                <SlidersHorizontal className="mr-2 h-5 w-5" />
                Filtros
                {activeFilters > 0 && (
                  <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-foreground px-2 text-xs font-bold text-primary">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">Filtros</SheetTitle>
                <SheetDescription>Refine sua busca por vagas.</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-primary" /> Região
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border/60 bg-surface px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {REGIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Briefcase className="h-4 w-4 text-primary" /> Tipo de contratação
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          type === t
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-surface text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="h-4 w-4 text-primary" /> Especialidades
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COURSES.map((c) => {
                      const active = specialties.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleSpecialty(c)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            active
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border/60 bg-surface text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-8 flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setRegion("Todas");
                    setType("Todos");
                    setSpecialties([]);
                  }}
                >
                  Limpar
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setFiltersOpen(false)}
                >
                  Aplicar
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "vaga encontrada" : "vagas encontradas"}
        </p>

        <div className="relative">
          <div className={`grid gap-5 md:grid-cols-2 lg:grid-cols-3 ${isLocked ? "pointer-events-none select-none blur-md" : ""}`}>
            {filtered.map((job, idx) => (
              <Fragment key={job.id}>
                <Link
                  to="/vagas/$jobId"
                  params={{ jobId: job.id }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/50 hover:shadow-gold"
                >
                  {/* Cover 16:9 */}
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src={job.cover}
                      alt={job.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <Badge className="absolute right-3 top-3 rounded-full bg-black/60 text-xs text-white backdrop-blur">
                      {job.type}
                    </Badge>
                    <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg">
                      {job.companyInitials}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold leading-tight transition group-hover:text-primary">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>📍 {job.location}</span>
                      <span>⏱ {job.shift}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-primary">{job.salary}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4 text-xs">
                      <span className="text-muted-foreground">{job.posted}</span>
                      <span className="font-semibold text-primary">{job.applicants} candidatos</span>
                    </div>
                  </div>
                </Link>
                {(idx + 1) % 5 === 0 && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <AdBanner ad={ADS[Math.floor(idx / 5) % ADS.length]} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="mx-4 max-w-md rounded-3xl border border-border/60 bg-card/95 p-8 text-center shadow-2xl backdrop-blur">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">Vagas exclusivas para membros</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cadastre-se ou faça login para ver todas as vagas e se candidatar.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to="/planos">Cadastrar</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/login">Entrar</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-card p-16 text-center">
            <p className="text-lg text-muted-foreground">Nenhuma vaga encontrada com esses filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
