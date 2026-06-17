export type ProfileInfoLike = {
  full_name?: string | null;
  city?: string | null;
  state?: string | null;
  role?: string | null;
  experience_years?: number | null;
  escolaridade?: string | null;
  estado_civil?: string | null;
  altura?: string | null;
  peso?: string | null;
  data_nascimento?: string | null;
  has_cnv?: boolean | null;
  cnv_number?: string | null;
  has_cnh?: boolean | null;
  served_military?: boolean | null;
  disponibilidade_viagem?: boolean | null;
  phone?: string | null;
  whatsapp?: string | null;
  specializations?: string[] | null;
};

function boolText(v: boolean | null | undefined): string {
  if (v === true) return "Sim";
  if (v === false) return "Não";
  return "Não informado";
}

/** "1995-04-20" -> "20/04/1995 · 31 anos" */
function fmtBirth(d: string | null | undefined): string | null {
  if (!d) return null;
  const [y, m, day] = d.slice(0, 10).split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

export function ProfessionalInfo({ profile }: { profile: ProfileInfoLike }) {
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const items: { label: string; value: string | null }[] = [
    { label: "Nome completo", value: profile.full_name || null },
    { label: "Função / Cargo", value: profile.role || null },
    { label: "Localização", value: location || null },
    { label: "Data de nascimento", value: fmtBirth(profile.data_nascimento) },
    { label: "Estado civil", value: profile.estado_civil || null },
    { label: "Altura", value: profile.altura ? `${profile.altura} cm` : null },
    { label: "Peso", value: profile.peso ? `${profile.peso} kg` : null },
    { label: "Escolaridade", value: profile.escolaridade || null },
    {
      label: "Anos de experiência",
      value: profile.experience_years ? `${profile.experience_years} ${profile.experience_years === 1 ? "ano" : "anos"}` : null,
    },
    {
      label: "Possui CNV",
      value: boolText(profile.has_cnv) + (profile.cnv_number ? ` · ${profile.cnv_number}` : ""),
    },
    { label: "Possui CNH (habilitação)", value: boolText(profile.has_cnh) },
    { label: "Já serviu o quartel", value: boolText(profile.served_military) },
    { label: "Disponível para viagem", value: boolText(profile.disponibilidade_viagem) },
    { label: "Status", value: profile.specializations?.[0] || null },
  ];

  return (
    <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5">
          <span className="text-sm text-muted-foreground">{it.label}</span>
          <span className="text-right text-sm font-semibold">{it.value || "Não informado"}</span>
        </div>
      ))}
    </div>
  );
}
