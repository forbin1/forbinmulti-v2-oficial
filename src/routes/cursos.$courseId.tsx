import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Clock,
  BookOpen,
  Award,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Download,
  PartyPopper,
  Circle,
  FileText,
  X,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";
import { CheckoutModal } from "@/components/CheckoutModal";

export const Route = createFileRoute("/cursos/$courseId")({
  head: () => ({ meta: [{ title: "Curso — FORBIN MultiEmpresas" }] }),
  component: CourseDetailPage,
});

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor: string;
  duration_hours: number | null;
  category: string;
  price: number | null;
  level: string;
  total_lessons: number;
};

type Module = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
};

type Lesson = {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  sort_order: number;
  quiz_enabled?: boolean;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
};

type Certificate = { id: string; certificate_code: string; issued_at: string };

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isActive: hasActivePlan, loading: subLoading } = useSubscription();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [adminCertificate, setAdminCertificate] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user?.id]);

  async function loadAll() {
    setLoading(true);
    const [{ data: courseData }, { data: moduleData }, { data: lessonData }] = await Promise.all([
      supabase.from("courses").select("*").eq("id", courseId).single(),
      supabase.from("course_modules").select("*").eq("course_id", courseId).order("sort_order"),
      supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order"),
    ]);

    if (courseData) setCourse(courseData as unknown as Course);
    setModules((moduleData as unknown as Module[]) || []);
    const ls = (lessonData as unknown as Lesson[]) || [];
    setLessons(ls);
    if (ls.length > 0) setCurrentLesson(ls[0]);

    if (user) {
      const [{ data: enr }, { data: prog }, { data: cert }] = await Promise.all([
        supabase.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", courseId).maybeSingle(),
        supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).eq("completed", true),
        supabase.from("certificates").select("*").eq("user_id", user.id).eq("course_id", courseId).maybeSingle(),
      ]);
      setEnrolled(user.email === "admin@gmail.com" || !!enr);
      const done = new Set<string>((prog || []).map((p: { lesson_id: string }) => p.lesson_id));
      setCompleted(done);
      setWatched(new Set(done)); // já assistido implica desbloqueado
      if (cert) setCertificate(cert as unknown as Certificate);

      if (courseData) {
        const { data: adminCert } = await supabase
          .from("user_certificates")
          .select("*")
          .eq("user_id", user.id)
          .ilike("name", `%${courseData.title}%`)
          .maybeSingle();
        if (adminCert) setAdminCertificate(adminCert);
      }
    }
    setLoading(false);
  }

  async function handleEnroll() {
    if (!user) {
      toast.error("Faça login para se matricular");
      navigate({ to: "/login" });
      return;
    }

    const freeCourse = course ? course.price === null || course.price === 0 : true;

    // Se o curso for grátis, exige plano ativo (exceto para admin)
    if (freeCourse && user.email !== "admin@gmail.com" && !hasActivePlan) {
      toast.error("Você precisa de uma assinatura ativa para acessar cursos gratuitos!");
      navigate({ to: "/planos" });
      return;
    }

    setEnrolling(true);
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    setEnrolling(false);
    if (error) {
      console.error("Enrollment error:", error);
      return toast.error("Erro ao se matricular: " + error.message);
    }
    setEnrolled(true);
    toast.success("Matrícula realizada!");
    void loadAll();
  }

  // chama quando o vídeo termina
  function onVideoEnded(lessonId: string) {
    setWatched((prev) => new Set(prev).add(lessonId));
    toast.success("Aula concluída! Você já pode marcar no checklist.");
  }

  async function toggleComplete(lessonId: string) {
    if (!user || !enrolled) return;
    const isEmbed = currentLesson?.video_url ? /youtube\.com|youtu\.be|vimeo\.com/.test(currentLesson.video_url) : false;
    if (!isEmbed && !watched.has(lessonId) && !completed.has(lessonId)) {
      toast.error("Assista o vídeo até o final para liberar o checklist.");
      return;
    }
    const isDone = completed.has(lessonId);

    if (isDone) {
      const { error } = await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
      if (error) {
        console.error("Error deleting progress:", error);
        toast.error("Erro ao remover progresso: " + error.message);
        return;
      }
      setCompleted((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
      return;
    }

    // Se a aula exige prova, abre o quiz em vez de concluir direto (admin não precisa).
    const lesson = lessons.find((l) => l.id === lessonId);
    const isAdmin = user.email === "admin@gmail.com";
    if (lesson?.quiz_enabled && !isAdmin) {
      setQuizLesson(lesson);
      return;
    }

    await finalizeComplete(lessonId);
  }

  async function finalizeComplete(lessonId: string) {
    if (!user) return;
    const { error } = await supabase.from("lesson_progress").upsert(
      { user_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" },
    );

    if (error) {
      console.error("Error saving progress:", error);
      toast.error("Erro ao salvar progresso: " + error.message);
      return;
    }

    const next = new Set(completed).add(lessonId);
    setCompleted(next);

    const allDone = lessons.length > 0 && lessons.every((l) => next.has(l.id));
    if (allDone) {
      await supabase
        .from("enrollments")
        .update({ completed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("course_id", courseId);
      fireConfetti();
      setShowCelebration(true);
    }
  }

  async function issueCertificate() {
    if (!user) return;
    const { data, error } = await supabase
      .from("certificates")
      .insert({ user_id: user.id, course_id: courseId })
      .select()
      .single();
    if (error || !data) return;
    setCertificate(data as unknown as Certificate);
    await supabase
      .from("enrollments")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("course_id", courseId);
    fireConfetti();
    setShowCelebration(true);
  }

  function fireConfetti() {
    const end = Date.now() + 2500;
    const colors = ["#c9a84c", "#f0d78c", "#ffffff"];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  // agrupa aulas por módulo
  const grouped = useMemo(() => {
    const byMod = new Map<string | null, Lesson[]>();
    for (const l of lessons) {
      const key = l.module_id ?? null;
      if (!byMod.has(key)) byMod.set(key, []);
      byMod.get(key)!.push(l);
    }
    const out: { module: Module | null; lessons: Lesson[] }[] = modules.map((m) => ({
      module: m,
      lessons: byMod.get(m.id) || [],
    }));
    const orphans = byMod.get(null);
    if (orphans && orphans.length) out.push({ module: null, lessons: orphans });
    return out;
  }, [modules, lessons]);

  // Extrai material de apoio se presente na descrição (Unconditional hook call for Rule of Hooks compliance)
  const { descriptionText, materialUrl } = useMemo(() => {
    if (!course || !course.description) return { descriptionText: "", materialUrl: null };
    const match = course.description.match(/\[SUPPORT_MATERIAL:(.*?)\]/);
    if (match) {
      return {
        descriptionText: course.description.replace(/\[SUPPORT_MATERIAL:(.*?)\]/, "").trim(),
        materialUrl: match[1],
      };
    }
    return { descriptionText: course.description, materialUrl: null };
  }, [course?.description]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Curso não encontrado</p>
        <Button asChild variant="outline"><Link to="/cursos">Voltar aos cursos</Link></Button>
      </div>
    );
  }

  const isFree = course.price === null;
  const total = lessons.length;
  const progressPercent = total > 0 ? Math.round((completed.size / total) * 100) : 0;
  const isAllDone = total > 0 && completed.size === total;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/40 bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/cursos" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar aos cursos
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative border-b border-border/40">
        <div className="absolute inset-0 overflow-hidden">
          <img src={course.thumbnail_url || ""} alt="" className="h-full w-full object-cover opacity-15 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="border-primary/30 bg-primary/20 text-primary">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                {isFree ? (
                  <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">Incluso na mensalidade</Badge>
                ) : (
                  <Badge className="border-primary/30 bg-primary/20 text-primary">
                    R$ {course.price?.toFixed(2).replace(".", ",")}
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold sm:text-4xl">{course.title}</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">{descriptionText}</p>
              <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {course.duration_hours}h de conteúdo</span>
                <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> {total} aulas</span>
                <span className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Certificado FORBIN</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Instrutor: <span className="font-medium text-foreground">{course.instructor}</span>
              </p>
            </div>

            {/* Progresso / CTA */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border/60 bg-card p-6 shadow-elevated">
                {enrolled ? (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Seu progresso</span>
                        <span className="font-semibold text-primary">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {completed.size} de {total} aulas concluídas
                      </p>
                    </div>
                    {adminCertificate ? (
                      <Button
                        asChild
                        className="w-full rounded-full bg-primary text-primary-foreground shadow-gold hover:bg-primary/95"
                      >
                        <a href={adminCertificate.pdf_url} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" /> Baixar Certificado
                        </a>
                      </Button>
                    ) : isAllDone ? (
                      <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-center text-xs text-yellow-400 font-medium">
                        Certificado em processamento administrativo
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Conclua todas as aulas para solicitar seu certificado FORBIN.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-video overflow-hidden rounded-lg">
                      <img src={course.thumbnail_url || ""} alt={course.title} className="h-full w-full object-cover" />
                    </div>
                    {!isFree && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gradient-gold">R$ {course.price?.toFixed(2).replace(".", ",")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">pagamento único</p>
                      </div>
                    )}
                    <Button
                      className="w-full rounded-full bg-primary text-primary-foreground shadow-gold hover:bg-primary/90"
                      onClick={isFree ? handleEnroll : () => setCheckoutOpen(true)}
                      disabled={enrolling}
                    >
                      {enrolling ? "Matriculando..." : isFree ? "Começar agora — Grátis" : "Comprar e Começar"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      <Award className="mr-1 inline h-3 w-3" /> Certificado FORBIN incluso
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Player + Conteúdo */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Player */}
          <div className="lg:col-span-2">
            {currentLesson ? (
              <LessonPlayer
                key={currentLesson.id}
                lesson={currentLesson}
                onEnded={() => onVideoEnded(currentLesson.id)}
                locked={!enrolled}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border/60 text-sm text-muted-foreground">
                Nenhuma aula disponível ainda.
              </div>
            )}

            {currentLesson && (
              <div className="mt-5 rounded-2xl border border-border/60 bg-card p-5">
                <h2 className="font-display text-xl font-bold">{currentLesson.title}</h2>
                {currentLesson.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{currentLesson.description}</p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {(() => {
                    const isEmbed = currentLesson.video_url ? /youtube\.com|youtu\.be|vimeo\.com/.test(currentLesson.video_url) : false;
                    const canComplete = enrolled && (isEmbed || watched.has(currentLesson.id) || completed.has(currentLesson.id));
                    
                    return (
                      <Button
                        onClick={() => toggleComplete(currentLesson.id)}
                        disabled={!canComplete}
                        className={cn(
                          "rounded-full px-6 transition-all duration-300",
                          completed.has(currentLesson.id)
                            ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                      >
                        {completed.has(currentLesson.id) ? (
                          <><CheckCircle2 className="mr-2 h-4 w-4" /> Aula concluída</>
                        ) : (isEmbed || watched.has(currentLesson.id)) ? (
                          currentLesson.quiz_enabled ? (
                            <><ClipboardCheck className="mr-2 h-4 w-4" /> Concluir aula (Prova)</>
                          ) : (
                            <><Circle className="mr-2 h-4 w-4 animate-pulse" /> Concluir aula</>
                          )
                        ) : (
                          <><Lock className="mr-2 h-4 w-4" /> Assista o vídeo para liberar</>
                        )}
                      </Button>
                    );
                  })()}
                  {!enrolled && (
                    <span className="text-xs text-muted-foreground">Matricule-se para liberar o checklist.</span>
                  )}
                </div>
              </div>
            )}

            {/* Material de Apoio */}
            {materialUrl && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-5 transition-all hover:border-primary/45 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Material de Apoio do Curso</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Clique no botão para baixar a apostila ou material complementar oficial.</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-full text-xs shrink-0 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    onClick={() => setIsMaterialOpen(true)}
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" /> Visualizar Material
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Checklist por módulos */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-border/60 bg-card">
              <div className="border-b border-border/60 p-5">
                <h3 className="font-display text-lg font-bold">Conteúdo do curso</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {modules.length} {modules.length === 1 ? "módulo" : "módulos"} · {total} aulas
                </p>
              </div>

              <div className="max-h-[640px] divide-y divide-border/40 overflow-y-auto">
                {grouped.length === 0 && (
                  <p className="p-6 text-sm text-muted-foreground">Nenhum módulo cadastrado ainda.</p>
                )}
                {grouped.map((g, gi) => {
                  const modDone = g.lessons.filter((l) => completed.has(l.id)).length;
                  return (
                    <div key={g.module?.id ?? `orphan-${gi}`} className="p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                            Módulo {gi + 1}
                          </p>
                          <p className="truncate text-sm font-semibold">
                            {g.module?.title ?? "Outras aulas"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {modDone}/{g.lessons.length}
                        </span>
                      </div>

                      <ul className="space-y-1.5">
                        {g.lessons.map((lesson, i) => {
                          const done = completed.has(lesson.id);
                          const isCurrent = currentLesson?.id === lesson.id;
                          return (
                            <li key={lesson.id}>
                              <button
                                onClick={() => setCurrentLesson(lesson)}
                                className={cn(
                                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                                  isCurrent ? "bg-primary/10" : "hover:bg-accent/50",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                    done
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : isCurrent
                                        ? "bg-primary/20 text-primary"
                                        : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                </span>
                                <span className="flex-1 truncate text-sm">{lesson.title}</span>
                                {lesson.duration_minutes ? (
                                  <span className="shrink-0 text-[11px] text-muted-foreground">
                                    {lesson.duration_minutes}min
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* Bloco de certificado pós conclusão */}
        {isAllDone && (
          <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center animate-fade-in shadow-lg">
            <Award className="mx-auto h-14 w-14 text-primary animate-pulse" />
            <h3 className="mt-3 font-display text-2xl font-bold text-gradient-gold">Curso Concluído!</h3>
            
            {adminCertificate ? (
              <div className="space-y-4">
                <p className="mt-2 text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
                  Parabéns! Seu certificado oficial do curso <strong>{course.title}</strong> foi emitido com sucesso pela administração e está disponível para download.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild className="rounded-full bg-primary text-primary-foreground shadow-gold px-8 py-2.5 hover:bg-primary/95 transition-all">
                    <a href={adminCertificate.pdf_url} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Baixar Certificado (PDF)
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="mt-2 text-muted-foreground text-sm max-w-lg mx-auto">
                  Você concluiu com sucesso todas as aulas do curso <strong>{course.title}</strong>.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-1.5 text-xs font-semibold text-yellow-400 border border-yellow-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  Aguardando envio do certificado pelo administrador
                </div>
                <p className="text-xs text-white/50 max-w-sm mx-auto leading-normal">
                  Nossa equipe administrativa foi notificada e está preparando o seu certificado oficial. Você poderá baixá-lo diretamente desta página em instantes.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Celebração modal */}
      {showCelebration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowCelebration(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
              <PartyPopper className="h-10 w-10 text-primary animate-bounce" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold text-gradient-gold">Parabéns!</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Você concluiu com excelência o curso <strong className="text-foreground">{course.title}</strong>.
            </p>
            
            {adminCertificate ? (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild className="rounded-full bg-primary text-primary-foreground shadow-gold px-6">
                  <a href={adminCertificate.pdf_url} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Baixar Certificado
                  </a>
                </Button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-xs text-yellow-400 font-medium">
                  Seu progresso de 100% foi registrado! O administrador fará o upload e vinculará seu certificado oficial em breve.
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-6 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {course && !isFree && (
        <CheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          plan={{
            name: course.title,
            installmentLabel: `R$ ${course.price?.toFixed(2).replace(".", ",")}`,
            pixLabel: `R$ ${course.price?.toFixed(2).replace(".", ",")}`,
            period: "Acesso Vitalício",
            audience: "professional",
            periodRaw: "month",
            slug: `course-${course.id}`,
          }}
          onSuccess={() => {
            setEnrolled(true);
            void loadAll();
          }}
        />
      )}

      {/* Prova da aula */}
      {quizLesson && (
        <QuizScreen
          lesson={quizLesson}
          onClose={() => setQuizLesson(null)}
          onPass={async () => {
            const id = quizLesson.id;
            setQuizLesson(null);
            await finalizeComplete(id);
            toast.success("Prova aprovada! Aula concluída. 🎉");
          }}
        />
      )}

      {/* Visualizador de Material em Tela Cheia */}
      {isMaterialOpen && materialUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-fade-in">
          {/* Header do Visualizador */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Material de Apoio</h3>
                <p className="text-xs text-white/50">{course.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="default" 
                className="rounded-full shadow-gold bg-primary text-primary-foreground hover:bg-primary/90 hidden sm:flex"
                onClick={async () => {
                  try {
                    toast.loading("Iniciando download...", { id: "downloading" });
                    const res = await fetch(materialUrl);
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Material_${course.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    toast.success("Download concluído!", { id: "downloading" });
                  } catch (e) {
                    toast.error("Erro ao tentar baixar o arquivo.", { id: "downloading" });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Baixar Arquivo
              </Button>
              <Button 
                variant="default" 
                size="icon" 
                className="rounded-full shadow-gold bg-primary text-primary-foreground hover:bg-primary/90 sm:hidden"
                title="Baixar Arquivo"
                onClick={async () => {
                  try {
                    toast.loading("Baixando...", { id: "downloading" });
                    const res = await fetch(materialUrl);
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Material_${course.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    toast.success("Concluído!", { id: "downloading" });
                  } catch (e) {
                    toast.error("Erro no download", { id: "downloading" });
                  }
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setIsMaterialOpen(false)}
                title="Fechar visualizador"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          {/* Área do Iframe */}
          <div className="flex-1 w-full h-full overflow-hidden p-2 sm:p-4">
            <div className="w-full h-full rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <iframe 
                src={`${materialUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full"
                title="Material de Apoio"
                frameBorder="0"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const QUESTION_SECONDS = 60;

function QuizScreen({ lesson, onClose, onPass }: { lesson: Lesson; onClose: () => void; onPass: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [score, setScore] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lesson_questions")
        .select("*")
        .eq("lesson_id", lesson.id)
        .order("sort_order");
      setQuestions((data as unknown as QuizQuestion[]) || []);
      setLoading(false);
    })();
  }, [lesson.id]);

  const current = questions[idx];
  // Precisa acertar pelo menos 4 de 5 (ou todas, se a prova tiver menos de 5).
  const passThreshold = questions.length >= 5 ? 4 : questions.length;

  const finish = useCallback((finalAnswers: Record<string, number | null>) => {
    const correct = questions.filter((q) => finalAnswers[q.id] === q.correct_index).length;
    setScore(correct);
    setPhase("result");
    if (questions.length > 0 && correct >= passThreshold) {
      confetti({ particleCount: 90, spread: 75, startVelocity: 45, origin: { y: 0.6 }, colors: ["#10b981", "#34d399", "#c9a84c", "#ffffff"] });
    }
  }, [questions, passThreshold]);

  const advance = useCallback((ans: number | null) => {
    const q = questions[idx];
    if (!q) return;
    const merged = { ...answers, [q.id]: ans };
    setAnswers(merged);
    if (idx + 1 >= questions.length) {
      finish(merged);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }, [idx, questions, answers, finish]);

  // Reinicia o cronômetro a cada nova pergunta.
  useEffect(() => {
    if (phase === "quiz") setTimeLeft(QUESTION_SECONDS);
  }, [idx, phase]);

  // Contagem regressiva (1s).
  useEffect(() => {
    if (phase !== "quiz" || loading || questions.length === 0 || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, loading, questions.length]);

  // Tempo esgotado: marca a atual com a seleção (ou em branco = errada) e avança.
  useEffect(() => {
    if (phase === "quiz" && !loading && questions.length > 0 && timeLeft === 0) {
      advance(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, loading]);

  const restart = () => {
    setPhase("quiz");
    setIdx(0);
    setSelected(null);
    setAnswers({});
    setScore(0);
    setTimeLeft(QUESTION_SECONDS);
  };

  const approved = score >= passThreshold;
  const progress = questions.length > 0 ? Math.round((idx / questions.length) * 100) : 0;
  const mmss = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Prova da aula</h3>
            <p className="text-xs text-muted-foreground">{lesson.title}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Barra de progresso + cronômetro (fase de prova) */}
      {phase === "quiz" && !loading && questions.length > 0 && (
        <div className="px-4 pt-4 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Pergunta {idx + 1} de {questions.length}</span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono", timeLeft <= 10 ? "bg-red-500/15 text-red-500" : "bg-muted text-muted-foreground")}>
                <Clock className="h-3.5 w-3.5" /> {mmss}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : questions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              Esta prova ainda não tem perguntas cadastradas. Avise o administrador.
            </p>
          ) : phase === "result" ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-center sm:p-8">
              <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full", approved ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500")}>
                {approved ? <CheckCircle2 className="h-8 w-8" /> : <X className="h-8 w-8" />}
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold">{approved ? "Aprovado! 🎉" : "Não foi dessa vez"}</h2>
              <p className="mt-2 text-lg font-semibold">
                Você acertou <span className={approved ? "text-emerald-500" : "text-red-500"}>{score}</span> de {questions.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {approved
                  ? "Você atingiu a nota mínima e pode concluir a aula."
                  : `É necessário acertar pelo menos ${passThreshold} para concluir. Refaça a prova.`}
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                {approved ? (
                  <Button className="rounded-full px-6" onClick={onPass}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir aula
                  </Button>
                ) : (
                  <Button className="rounded-full px-6" onClick={restart}>Refazer prova</Button>
                )}
                <Button variant="outline" className="rounded-full px-6" onClick={onClose}>Sair</Button>
              </div>
            </div>
          ) : current ? (
            <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-7">
              <p className="text-lg font-semibold leading-snug">{idx + 1}. {current.question}</p>
              <div className="mt-5 space-y-2.5">
                {current.options.map((opt, oi) => {
                  const isSel = selected === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setSelected(oi)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition",
                        isSel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-surface hover:border-primary/40",
                      )}
                    >
                      <span className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                        isSel ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-muted-foreground",
                      )}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Rodapé: avançar (fase de prova) */}
      {phase === "quiz" && !loading && questions.length > 0 && current && (
        <div className="border-t border-border/60 p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Responda e avance. Você verá o resultado no final.</p>
            <Button className="rounded-full px-6" disabled={selected === null} onClick={() => advance(selected)}>
              {idx + 1 >= questions.length ? "Finalizar prova" : "Próxima pergunta"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonPlayer({
  lesson,
  onEnded,
  locked,
}: {
  lesson: Lesson;
  onEnded: () => void;
  locked: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [lesson.id]);

  if (locked) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/60 bg-black">
        {lesson.video_url && (
          <img
            src=""
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
          <Lock className="h-10 w-10 text-primary" />
          <p className="text-sm">Matricule-se para assistir esta aula</p>
        </div>
      </div>
    );
  }

  if (!lesson.video_url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border/60 text-sm text-muted-foreground">
        Vídeo ainda não enviado para esta aula.
      </div>
    );
  }

  // suporta upload direto e URL (incl. Youtube embed simples)
  const src = lesson.video_url;
  const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/.test(src);

  if (isEmbed) {
    const embed = src.includes("watch?v=")
      ? src.replace("watch?v=", "embed/")
      : src.includes("youtu.be/")
        ? src.replace("youtu.be/", "youtube.com/embed/")
        : src;
    return (
      <div className="aspect-video overflow-hidden rounded-2xl border border-border/60 bg-black">
        <iframe
          src={embed}
          title={lesson.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <p className="bg-card px-4 py-2 text-[11px] text-muted-foreground">
          Para vídeos externos, marque manualmente a aula como concluída após assistir.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-black">
      <video
        ref={ref}
        src={src}
        controls
        controlsList="nodownload"
        className="aspect-video w-full"
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (!firedRef.current && v.duration > 0 && v.currentTime / v.duration >= 0.95) {
            firedRef.current = true;
            onEnded();
          }
        }}
        onEnded={() => {
          if (!firedRef.current) {
            firedRef.current = true;
            onEnded();
          }
        }}
      />
    </div>
  );
}

// reexport icon for type-safe usage
export { Play };
