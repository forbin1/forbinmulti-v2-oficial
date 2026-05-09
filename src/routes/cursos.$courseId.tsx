import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
};

type Certificate = { id: string; certificate_code: string; issued_at: string };

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
  const [showCelebration, setShowCelebration] = useState(false);

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
      setEnrolled(!!enr);
      const done = new Set<string>((prog || []).map((p: { lesson_id: string }) => p.lesson_id));
      setCompleted(done);
      setWatched(new Set(done)); // já assistido implica desbloqueado
      if (cert) setCertificate(cert as unknown as Certificate);
    }
    setLoading(false);
  }

  async function handleEnroll() {
    if (!user) {
      toast.error("Faça login para se matricular");
      navigate({ to: "/login" });
      return;
    }
    setEnrolling(true);
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    setEnrolling(false);
    if (error) return toast.error("Erro ao se matricular");
    setEnrolled(true);
    toast.success("Matrícula realizada!");
  }

  // chama quando o vídeo termina
  function onVideoEnded(lessonId: string) {
    setWatched((prev) => new Set(prev).add(lessonId));
    toast.success("Aula concluída! Você já pode marcar no checklist.");
  }

  async function toggleComplete(lessonId: string) {
    if (!user || !enrolled) return;
    if (!watched.has(lessonId) && !completed.has(lessonId)) {
      toast.error("Assista o vídeo até o final para liberar o checklist.");
      return;
    }
    const isDone = completed.has(lessonId);

    if (isDone) {
      await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
      setCompleted((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
      return;
    }

    await supabase.from("lesson_progress").upsert(
      { user_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" },
    );
    const next = new Set(completed).add(lessonId);
    setCompleted(next);

    const allDone = lessons.length > 0 && lessons.every((l) => next.has(l.id));
    if (allDone && !certificate) {
      await issueCertificate();
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
              <p className="mt-4 leading-relaxed text-muted-foreground">{course.description}</p>
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
                    {certificate ? (
                      <Button
                        onClick={() => window.print()}
                        className="w-full rounded-full bg-primary text-primary-foreground shadow-gold"
                      >
                        <Download className="mr-2 h-4 w-4" /> Baixar Certificado
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Conclua todas as aulas para emitir seu certificado FORBIN.
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
                      onClick={handleEnroll}
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
                  <Button
                    onClick={() => toggleComplete(currentLesson.id)}
                    disabled={!enrolled || (!watched.has(currentLesson.id) && !completed.has(currentLesson.id))}
                    className={cn(
                      "rounded-full",
                      completed.has(currentLesson.id)
                        ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {completed.has(currentLesson.id) ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Aula concluída</>
                    ) : watched.has(currentLesson.id) ? (
                      <><Circle className="mr-2 h-4 w-4" /> Marcar como concluída</>
                    ) : (
                      <><Lock className="mr-2 h-4 w-4" /> Assista o vídeo todo</>
                    )}
                  </Button>
                  {!enrolled && (
                    <span className="text-xs text-muted-foreground">Matricule-se para liberar o checklist.</span>
                  )}
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
        {certificate && (
          <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <Award className="mx-auto h-14 w-14 text-primary" />
            <h3 className="mt-3 font-display text-2xl font-bold">Certificado FORBIN emitido</h3>
            <p className="mt-2 text-muted-foreground">
              Parabéns pela conclusão do curso <strong>{course.title}</strong>.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Código: {certificate.certificate_code} · Emitido em{" "}
              {new Date(certificate.issued_at).toLocaleDateString("pt-BR")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="rounded-full bg-primary text-primary-foreground shadow-gold">
                <Link to="/certificados">Abrir certificado</Link>
              </Button>
              <Button onClick={() => window.print()} variant="outline" className="rounded-full">
                <Download className="mr-2 h-4 w-4" /> Baixar PDF
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Celebração modal */}
      {showCelebration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowCelebration(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
              <PartyPopper className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold">Parabéns!</h2>
            <p className="mt-3 text-muted-foreground">
              Você concluiu <strong className="text-foreground">{course.title}</strong>. Seu certificado FORBIN
              já está disponível.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                onClick={() => {
                  setShowCelebration(false);
                  navigate({ to: "/certificados" });
                }}
                className="rounded-full bg-primary text-primary-foreground shadow-gold"
              >
                <Award className="mr-2 h-4 w-4" /> Abrir certificado
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCelebration(false);
                  window.print();
                }}
                className="rounded-full"
              >
                <Download className="mr-2 h-4 w-4" /> Baixar PDF
              </Button>
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground"
            >
              Fechar
            </button>
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
