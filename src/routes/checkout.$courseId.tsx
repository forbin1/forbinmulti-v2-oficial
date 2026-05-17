import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Star, Lock, CheckCircle2, User, Mail, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/checkout/$courseId")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { courseId } = Route.useParams();
  const { ref } = Route.useSearch() as { ref?: string };
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url, price, instructor, category, duration_hours, total_lessons, commission_percentage")
        .eq("id", courseId)
        .eq("is_published", true)
        .maybeSingle();
      setCourse(data);
      setLoading(false);
    };
    fetchCourse();
  }, [courseId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome obrigatório";
    if (!form.email.includes("@")) errs.email = "E-mail inválido";
    if (form.password.length < 6) errs.password = "Mínimo de 6 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1. Create account with Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            role: "professional",
          },
        },
      });

      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Usuário não criado.");

      // 2. Enroll the user in the course immediately
      await supabase.from("enrollments").upsert({
        user_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
      }, { onConflict: "user_id,course_id" });

      // 3. Register affiliate conversion (if ref is present)
      if (ref) {
        await supabase.from("affiliate_conversions").insert({
          affiliate_code: ref,
          course_id: courseId,
          buyer_user_id: userId,
        }).select();
      }

      setStep("success");
    } catch (err: any) {
      // If user already exists, try to log in and enroll
      if (err.message?.includes("already registered") || err.message?.includes("User already registered")) {
        toast.error("Esse e-mail já possui conta. Faça login para acessar.");
      } else {
        toast.error("Erro: " + err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-xl font-bold">Curso não encontrado.</p>
        <Button onClick={() => navigate({ to: "/cursos" })}>Ver todos os cursos</Button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-3xl border border-success/30 bg-success/10 p-10 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-black">Acesso Liberado!</h1>
          <p className="mt-3 text-muted-foreground">
            Sua conta foi criada e você já está matriculado em <strong className="text-foreground">{course.title}</strong>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Confira seu e-mail para confirmar a conta, depois faça login para começar!
          </p>
          <Button
            className="mt-8 w-full rounded-full bg-primary px-8 font-bold shadow-gold hover:bg-primary/90"
            onClick={() => navigate({ to: "/login" })}
          >
            Ir para o Login
          </Button>
        </div>
      </div>
    );
  }

  const isFree = !course.price || course.price === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="FORBIN" className="h-8" onError={(e) => (e.currentTarget.style.display = "none")} />
            <span className="font-display text-lg font-black tracking-tight">FORBIN</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-success" />
            Checkout seguro
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Left: Course info */}
          <div className="space-y-6">
            {/* Course card */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt={course.title} className="h-48 w-full object-cover sm:h-56" />
              )}
              <div className="p-6">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">{course.category}</span>
                <h1 className="mt-1.5 font-display text-2xl font-black tracking-tight sm:text-3xl">{course.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-primary" /> {course.instructor}</span>
                  <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" /> {course.total_lessons} aulas</span>
                  {course.duration_hours > 0 && <span>{course.duration_hours}h de conteúdo</span>}
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="mb-4 font-bold">O que você vai ganhar:</h3>
              <ul className="space-y-3 text-sm">
                {[
                  "Acesso imediato após o cadastro",
                  "Estude no seu ritmo, sem prazo",
                  "Certificado ao concluir o curso",
                  "Suporte da comunidade FORBIN",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> Plataforma 100% segura</span>
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-success" /> Dados protegidos</span>
            </div>
          </div>

          {/* Right: Signup form */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xl sm:p-8">
              {/* Price */}
              <div className="mb-6 text-center">
                {isFree ? (
                  <div>
                    <span className="font-display text-4xl font-black text-success">GRÁTIS</span>
                    <p className="text-sm text-muted-foreground mt-1">Incluso na assinatura</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor único</p>
                    <span className="font-display text-4xl font-black">
                      R$ {Number(course.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-5 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-center text-primary font-semibold">
                Crie sua conta e acesse agora mesmo
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="co-name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="co-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Seu nome"
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="co-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="co-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="co-password">Crie uma senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="co-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 pr-10 rounded-xl"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-primary py-5 text-base font-bold shadow-gold hover:bg-primary/90 text-primary-foreground"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Criando conta...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-5 w-5" /> {isFree ? "Criar conta e acessar" : "Criar conta e comprar"}</>
                  )}
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Já tem conta?{" "}
                  <a href="/login" className="text-primary underline hover:no-underline">
                    Faça login
                  </a>
                </p>
              </form>

              <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground border-t border-border/60 pt-5">
                <Lock className="h-3.5 w-3.5 text-success" />
                Seus dados estão seguros e protegidos
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
