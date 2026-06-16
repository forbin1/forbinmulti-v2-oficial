// Sistema de níveis do profissional (Bronze / Prata / Ouro / Diamante).
// O nível é calculado automaticamente a partir dos cursos, anos de carteira
// assinada (experience_years) e experiências profissionais cadastradas.

export type LevelTier = "diamante" | "ouro" | "prata" | "bronze" | "none";

/** Opções de escolaridade do profissional. */
export const ESCOLARIDADE_OPTIONS = [
  "Ensino Fundamental Incompleto",
  "Ensino Fundamental Completo",
  "Ensino Médio Incompleto",
  "Ensino Médio Completo",
  "Ensino Técnico",
  "Ensino Superior Incompleto",
  "Ensino Superior Completo",
  "Pós-graduação",
] as const;

/** Categorias usadas no cadastro de experiências profissionais. */
export const EXPERIENCE_CATEGORIES = [
  "Vigilância Patrimonial",
  "Escolta Armada",
  "Transporte de Valores",
  "Segurança Pessoal Privada (SPP)",
  "Grandes Eventos",
  "Eventos Sociais/Corporativos",
  "Supervisor",
  "CFTV",
  "Portaria",
  "Outro",
] as const;

type Flags = {
  isFormacao: boolean;
  specialty: boolean; // Escolta, Valores, SPP, Grandes Eventos, Supervisor, CFTV
  event: boolean; // eventos sociais/corporativos/grandes eventos
  critical: boolean; // Escolta, Valores, SPP ou Grandes Eventos
};

/** Classifica um texto (nome de curso ou categoria de experiência). */
function classify(raw: string | null | undefined): Flags {
  const t = (raw ?? "").toLowerCase();
  const escolta = t.includes("escolta");
  const valores = t.includes("transporte de valores") || (t.includes("valor") && t.includes("transporte"));
  const spp =
    t.includes("spp") ||
    t.includes("segurança pessoal") ||
    t.includes("seguranca pessoal") ||
    t.includes("pessoal privada");
  const grandesEventos = t.includes("grandes eventos") || t.includes("grande evento");
  const event = t.includes("evento"); // sociais, corporativos e grandes eventos
  const supervisor = t.includes("supervisor");
  const cftv = t.includes("cftv");
  const isFormacao = t.includes("formação de vigilante") || t.includes("formacao de vigilante");

  return {
    isFormacao,
    specialty: escolta || valores || spp || grandesEventos || supervisor || cftv,
    event,
    critical: escolta || valores || spp || grandesEventos,
  };
}

export type LevelExperienceInput = {
  category?: string | null;
  position?: string | null;
  company?: string | null;
};

export type LevelInput = {
  courses?: string[] | null;
  /** Anos de carteira assinada na área. */
  experienceYears?: number | null;
  experiences?: LevelExperienceInput[] | null;
};

export type LevelResult = {
  tier: LevelTier;
  /** Critérios avaliados, úteis para mostrar "o que falta" no perfil. */
  facts: {
    hasFormacao: boolean;
    hasSpecialty: boolean;
    hasEventExperience: boolean;
    hasCriticalExperience: boolean;
    experienceYears: number;
    experienceCount: number;
    eventExperienceCount: number;
  };
};

export function computeLevel(input: LevelInput): LevelResult {
  const courses = input.courses ?? [];
  const experiences = input.experiences ?? [];
  const experienceYears = Math.max(0, Math.floor(input.experienceYears ?? 0));

  const expText = (e: LevelExperienceInput) =>
    [e.category, e.position].filter(Boolean).join(" ");

  // Especialidade e eventos podem vir de cursos OU experiências.
  const combined = [...courses, ...experiences.map(expText)];

  const hasFormacao = courses.some((c) => classify(c).isFormacao);
  const hasSpecialty = combined.some((t) => classify(t).specialty);
  const hasEventExperience = combined.some((t) => classify(t).event);
  // "Experiência comprovada" => precisa ser uma experiência cadastrada.
  const hasCriticalExperience = experiences.some((e) => classify(expText(e)).critical);

  const experienceCount = experiences.length;
  const eventExperienceCount = experiences.filter((e) => classify(expText(e)).event).length;

  const facts = {
    hasFormacao,
    hasSpecialty,
    hasEventExperience,
    hasCriticalExperience,
    experienceYears,
    experienceCount,
    eventExperienceCount,
  };

  let tier: LevelTier = "none";

  if (hasFormacao) {
    if (hasSpecialty && experienceYears >= 5 && hasCriticalExperience) {
      tier = "diamante";
    } else if (hasSpecialty && (experienceYears >= 1 || experienceCount >= 30)) {
      tier = "ouro";
    } else if (hasEventExperience && (experienceYears >= 1 || eventExperienceCount >= 10)) {
      tier = "prata";
    } else {
      tier = "bronze";
    }
  }

  return { tier, facts };
}

export const LEVEL_META: Record<LevelTier, { label: string; description: string }> = {
  diamante: {
    label: "Diamante",
    description: "Vigilante com 5+ anos de carteira e experiência comprovada em operações críticas.",
  },
  ouro: {
    label: "Ouro",
    description: "Vigilante com especialização avançada e experiência consolidada na área.",
  },
  prata: {
    label: "Prata",
    description: "Vigilante com experiência em eventos sociais ou corporativos.",
  },
  bronze: {
    label: "Bronze",
    description: "Curso de Formação de Vigilante concluído.",
  },
  none: {
    label: "Não classificado",
    description: "Conclua o Curso de Formação de Vigilante para iniciar sua classificação.",
  },
};
