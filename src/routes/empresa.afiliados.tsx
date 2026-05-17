import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Link as LinkIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/empresa/afiliados")({
  component: EmpresaAfiliados,
});

function EmpresaAfiliados() {
  const { user } = useAuth();
  const [affiliations, setAffiliations] = useState<Record<string, 'none' | 'pending' | 'approved'>>({
    "c1": "none", "c2": "approved", "c3": "pending"
  });

  const requestAffiliation = (id: string) => {
    setAffiliations(prev => ({ ...prev, [id]: 'pending' }));
    toast.success("Solicitação enviada para o Admin Master!");
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Marketplace de Cursos</h1>
          <p className="text-muted-foreground mt-1">
            Venda cursos da plataforma para seus candidatos e ganhe comissões automáticas.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Comissões Recebidas</p>
            <p className="font-bold text-primary">R$ 1.450,00</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { id: "c1", title: "Formação de Vigilante 2025", price: "R$ 800,00", com: "20%", val: "R$ 160,00" },
          { id: "c2", title: "Reciclagem de Vigilantes", price: "R$ 350,00", com: "15%", val: "R$ 52,50" },
          { id: "c3", title: "Operador de CFTV", price: "R$ 450,00", com: "25%", val: "R$ 112,50" },
        ].map((c) => {
          const status = affiliations[c.id];
          return (
            <div key={c.id} className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface flex flex-col">
              <div className="h-32 bg-primary/20 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1541888086925-0c13d80b623b?q=80&w=600&auto=format&fit=crop)' }}></div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-bold text-lg">{c.title}</h3>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço: <span className="font-semibold text-foreground">{c.price}</span></span>
                  <Badge className="bg-success/20 text-success border-success/30">Comissão {c.com}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground border-b border-border/40 pb-4">
                  Você ganha <strong className="text-primary">{c.val}</strong> por venda.
                </p>
                
                <div className="mt-auto pt-4">
                  {status === 'approved' ? (
                    <div className="space-y-2">
                      <Badge className="bg-primary/20 text-primary w-full justify-center py-1">Afiliado Aprovado</Badge>
                      <Button variant="outline" className="w-full text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => {
                        navigator.clipboard.writeText(`https://forbin.com/c/${c.id}?ref=${user?.id}`);
                        toast.success("Link de venda copiado! Envie para seus candidatos.");
                      }}>
                        <LinkIcon className="mr-2 h-3 w-3" /> Copiar Link de Venda
                      </Button>
                    </div>
                  ) : status === 'pending' ? (
                    <Button disabled variant="outline" className="w-full">
                      <Clock className="mr-2 h-4 w-4" /> Em análise pelo Admin
                    </Button>
                  ) : (
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => requestAffiliation(c.id)}>
                      Solicitar Afiliação
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
