// Diretório unificado de perfis (profissionais + empresas) com @handle.
// Usado para menções, favoritos e roteamento de perfis individuais.

export type ProfileKind = "professional" | "company";

export type ProfileEntry = {
  id: string;
  handle: string; // sem @
  name: string;
  role: string;
  kind: ProfileKind;
  initials: string;
  location?: string;
  whatsapp?: string;
  bio?: string;
};

export const PROFILES: ProfileEntry[] = [
  // Profissionais
  { id: "1", handle: "carlos.silva", name: "Carlos Silva", role: "Vigilante CLT", kind: "professional", initials: "CS", location: "São Paulo, SP", whatsapp: "5511999999999", bio: "Vigilante com 8 anos de experiência em condomínios premium." },
  { id: "2", handle: "renata.oliveira", name: "Renata Oliveira", role: "Operadora de CFTV", kind: "professional", initials: "RO", location: "Curitiba, PR", whatsapp: "5541988887777", bio: "Especialista em monitoramento inteligente." },
  { id: "3", handle: "marcos.tavares", name: "Marcos Tavares", role: "Supervisor de Segurança", kind: "professional", initials: "MT", location: "Belo Horizonte, MG", whatsapp: "5531977776666", bio: "Supervisor com formação em defesa pessoal." },
  { id: "4", handle: "julia.santos", name: "Júlia Santos", role: "Escolta Armada", kind: "professional", initials: "JS", location: "Rio de Janeiro, RJ", whatsapp: "5521966665555", bio: "Escolta armada experiente." },
  { id: "5", handle: "pedro.almeida", name: "Pedro Almeida", role: "Bombeiro Civil", kind: "professional", initials: "PA", location: "Salvador, BA", whatsapp: "5571955554444", bio: "Bombeiro civil em eventos." },
  { id: "6", handle: "ana.costa", name: "Ana Costa", role: "Vigilante Líder", kind: "professional", initials: "AC", location: "Brasília, DF", whatsapp: "5561944443333", bio: "Líder de equipe." },
  { id: "carlos.mendes", handle: "carlos.mendes", name: "Carlos Mendes", role: "Vigilante Líder", kind: "professional", initials: "CM", location: "São Paulo, SP", whatsapp: "5511999990000", bio: "8 anos de experiência." },

  // Empresas
  { id: "vigilancia-total", handle: "vigilancia.total", name: "Vigilância Total LTDA", role: "Empresa de segurança patrimonial", kind: "company", initials: "VT", location: "São Paulo, SP", whatsapp: "5511933332222", bio: "Atuação em condomínios premium e corporativo." },
  { id: "aguia-negra", handle: "aguia.negra", name: "Águia Negra Segurança", role: "Escolta e transporte", kind: "company", initials: "AN", location: "Rio de Janeiro, RJ", whatsapp: "5521922221111", bio: "Escolta armada e transporte de valores." },
  { id: "olho-vivo", handle: "olho.vivo", name: "Olho Vivo Monitoramento", role: "Central CFTV 24h", kind: "company", initials: "OV", location: "Curitiba, PR", whatsapp: "5541911110000", bio: "Monitoramento 24h." },
];

export function findProfileByHandle(handle: string): ProfileEntry | undefined {
  const h = handle.replace(/^@/, "").toLowerCase();
  return PROFILES.find((p) => p.handle.toLowerCase() === h);
}

export function findProfileById(id: string): ProfileEntry | undefined {
  return PROFILES.find((p) => p.id === id);
}
