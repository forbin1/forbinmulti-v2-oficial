import { createFileRoute } from "@tanstack/react-router";
import { Heart, Search, Eye, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/empresa/favoritos")({
  component: EmpresaFavoritos,
});

function EmpresaFavoritos() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadFavorites = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Try to fetch favorites
      const { data: favs, error: favsErr } = await supabase
        .from("company_favorites")
        .select("*")
        .eq("company_id", user.id);

      if (favsErr) {
        // Table might not exist yet, handle gracefully
        setFavorites([]);
        return;
      }

      if (!favs || favs.length === 0) {
        setFavorites([]);
        return;
      }

      // Fetch matching professional profiles
      const profIds = favs.map(f => f.professional_id);
      const { data: profiles, error: profsErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, phone, experience_years, city, state")
        .in("user_id", profIds);

      if (profsErr) throw profsErr;

      const mappedFavs = favs.map(fav => {
        const profile = profiles?.find(p => p.user_id === fav.professional_id);
        return {
          ...fav,
          name: profile?.full_name || "Profissional",
          avatar: profile?.avatar_url,
          phone: profile?.phone || "Não informado",
          exp: profile?.experience_years || 0,
          city: profile?.city || "Não informada",
          state: profile?.state || "",
        };
      });

      setFavorites(mappedFavs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const removeFavorite = async (favId: string) => {
    try {
      const { error } = await supabase
        .from("company_favorites")
        .delete()
        .eq("id", favId);

      if (error) throw error;
      toast.success("Profissional removido dos favoritos.");
      loadFavorites();
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  const filteredFavs = favorites.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Favoritos</h1>
        <p className="text-muted-foreground mt-1">Seus candidatos e profissionais salvos para contratações futuras.</p>
      </div>

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar nos favoritos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-surface" 
          />
        </div>
      </div>

      {filteredFavs.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">Nenhum favorito salvo ainda</p>
          <p className="text-muted-foreground text-sm">
            Marque profissionais de destaque como favorito no perfil deles para que apareçam aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
          <ul className="divide-y divide-border/40">
            {filteredFavs.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-4 p-5 hover:bg-surface/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-bold text-primary-foreground">
                  {f.avatar ? (
                    <img src={f.avatar} alt={f.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    f.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-lg">{f.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Exp: {f.exp} anos · Local: {f.city}, {f.state} · Contato: {f.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Eye className="mr-1 h-3.5 w-3.5" /> Ver Perfil
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFavorite(f.id)}
                    className="text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
