import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { GraduationCap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/certificados")({
  head: () => ({ meta: [{ title: "Meus Certificados — FORBIN" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
  },
  component: Certificados,
});

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Certificate = {
  id: string;
  name: string;
  pdf_url: string;
  issued_at: string;
  hours: string | null;
};

function Certificados() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });
      setCerts((data as Certificate[]) || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Meus Certificados</h1>
      <p className="mt-2 text-muted-foreground">Certificados individuais cadastrados pelo administrador.</p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {certs.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Emitido em {new Date(c.issued_at).toLocaleDateString("pt-BR")} {c.hours ? `· ${c.hours}` : ""}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <a href={c.pdf_url} target="_blank" rel="noreferrer">
                  <Download className="mr-1.5 h-4 w-4" /> Baixar PDF
                </a>
              </Button>
            </div>
          ))}
          {certs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
              <p className="text-muted-foreground">Você ainda não possui certificados individuais cadastrados.</p>
              <Button asChild className="mt-4 rounded-full"><Link to="/cursos">Ver cursos disponíveis</Link></Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
