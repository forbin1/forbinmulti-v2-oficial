import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Play, Lock } from "lucide-react";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

const getCourses = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return (data as Course[]) || [];
});

export const Route = createFileRoute("/cursos")({
  head: () => ({
    meta: [
      { title: "Área de Membros — FORBIN MultiEmpresas" },
      { name: "description", content: "Área de membros com cursos de segurança privada e certificado FORBIN." },
    ],
  }),
  loader: () => getCourses(),
  component: CursosPage,
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

function CursosPage() {
  const rawCourses = Route.useLoaderData() as Course[];
  let courses = rawCourses || [];
  // Fallback para mock data se o banco estiver vazio
  if (courses.length === 0) {
    courses = [
      {
        id: "mock-1",
        title: "Formação Especial de Escolta Armada",
        description: "Curso completo prático e teórico",
        thumbnail_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=640&fit=crop",
        instructor: "FORBIN Academy",
        duration_hours: 40,
        category: "Especializações",
        price: null,
        level: "Avançado",
        total_lessons: 12
      },
      {
        id: "mock-2",
        title: "Táticas de Defesa Pessoal",
        description: "Defesa e imobilização",
        thumbnail_url: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1920&h=640&fit=crop",
        instructor: "FORBIN Academy",
        duration_hours: 20,
        category: "Especializações",
        price: null,
        level: "Intermediário",
        total_lessons: 8
      },
      {
        id: "mock-3",
        title: "Liderança e Gestão de Equipes",
        description: "Para supervisores",
        thumbnail_url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&h=640&fit=crop",
        instructor: "FORBIN Academy",
        duration_hours: 15,
        category: "Gestão",
        price: null,
        level: "Avançado",
        total_lessons: 5
      },
      {
        id: "mock-4",
        title: "Operador de CFTV Inteligente",
        description: "Monitoramento",
        thumbnail_url: "https://images.unsplash.com/photo-1564540583246-934409427776?w=1920&h=640&fit=crop",
        instructor: "FORBIN Academy",
        duration_hours: 30,
        category: "Tecnologia",
        price: null,
        level: "Iniciante",
        total_lessons: 10
      }
    ];
  }

  const categories = [...new Set(courses.map((c) => c.category))];
  const grouped = categories.map((cat) => ({
    category: cat,
    courses: courses.filter((c) => c.category === cat),
  }));

  const heroCourse = courses[0];


  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Banner - Full Width */}
      {heroCourse && (
        <section className="relative w-full overflow-hidden">
          <div className="relative aspect-[1920/800] max-h-[80vh] w-full">
            <img
              src={heroCourse.thumbnail_url || "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=640&fit=crop"}
              alt={heroCourse.title}
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-4 py-5 text-left sm:p-10 lg:p-16">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">
              Área de Membros
            </p>
            <h1 className="font-display text-base font-bold leading-tight sm:text-4xl lg:text-5xl">
              FORBIN MultiEmpresas
            </h1>
            <p className="mt-1 max-w-xl text-[11px] leading-snug text-white/70 sm:mt-2 sm:text-base">
              Capacite-se com os melhores cursos de segurança privada. Certificado FORBIN incluso.
            </p>
            <Link
              to="/cursos/$courseId"
              params={{ courseId: heroCourse.id }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:mt-4 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Começar agora
            </Link>
          </div>
        </section>
      )}

      {/* Course Sections by Category */}
      <SubscriptionGuard feature="assistir cursos e obter certificados">
        <div className="pb-20">
          {grouped.map((g) => (
            <section key={g.category} className="mt-12">
              <div className="mb-4 px-4 sm:px-6 lg:px-10 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">●</span>
                <h2 className="font-display text-xl font-bold sm:text-2xl">{g.category}</h2>
              </div>

              {/* Horizontal Scroll Container */}
              <div className="flex gap-4 overflow-x-auto pb-8 pt-2 px-4 sm:px-6 lg:px-10 snap-x snap-mandatory hide-scrollbar">
                {g.courses.map((course, i) => (
                  <div key={course.id} className="snap-start shrink-0 w-44 sm:w-52 lg:w-64">
                    <CourseModule course={course} index={i} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </SubscriptionGuard>
    </div>
  );
}

function CourseModule({ course, index }: { course: Course; index: number }) {
  const isFree = course.price === null;

  return (
    <Link
      to="/cursos/$courseId"
      params={{ courseId: course.id }}
      className="group relative flex flex-col"
    >
      {/* Card */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(201,168,76,0.15)]">
        <img
          src={course.thumbnail_url || `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=530&fit=crop&seed=${index}`}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 shadow-lg">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Price badge */}
        {!isFree && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              <Lock className="h-2.5 w-2.5" />
              R$ {course.price?.toFixed(2).replace(".", ",")}
            </span>
          </div>
        )}

        {/* Bottom text */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display text-sm font-bold leading-tight text-white line-clamp-2">
            {course.title}
          </h3>
          <p className="mt-1 text-[11px] text-white/50">
            Módulo {index + 1}
          </p>
        </div>
      </div>
    </Link>
  );
}
