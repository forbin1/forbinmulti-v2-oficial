export const COURSES = [
  "Formação de Vigilante",
  "Reciclagem de Vigilante",
  "Vigilante Líder",
  "Escolta Armada",
  "Transporte de Valores",
  "Segurança Pessoal Privada",
  "Operador de CFTV",
  "Eventos Sociais",
  "Supervisor de Segurança",
  "Porteiro Profissional",
  "Bombeiro Civil",
  "Defesa Pessoal",
] as const;

export type Job = {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  location: string;
  shift: string;
  salary: string;
  type: "CLT" | "PJ" | "Diária" | "Temporário";
  posted: string;
  applicants: number;
  description: string;
  requirements: string[];
  benefits: string[];
  cover: string;
};

const COVERS = [
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1564540583246-934409427776?w=1280&h=720&fit=crop",
];

export const JOBS: Job[] = ([
  {
    id: "vig-noturno-sp",
    title: "Vigilante Noturno — Condomínio Premium",
    company: "Vigilância Total LTDA",
    companyInitials: "VT",
    location: "São Paulo, SP",
    shift: "12x36 Noturno",
    salary: "R$ 2.450 + benefícios",
    type: "CLT",
    posted: "Há 2 dias",
    applicants: 47,
    description:
      "Atuar na segurança patrimonial de condomínio residencial de alto padrão, controle de acesso, rondas e monitoramento.",
    requirements: ["Curso de Formação de Vigilante atualizado", "Experiência mínima de 1 ano", "Boa apresentação"],
    benefits: ["Vale refeição R$ 35/dia", "Vale transporte", "Plano de saúde", "Uniforme completo"],
  },
  {
    id: "escolta-armada-rj",
    title: "Escolta Armada — Transporte Executivo",
    company: "Águia Negra Segurança",
    companyInitials: "AN",
    location: "Rio de Janeiro, RJ",
    shift: "Sob escala",
    salary: "R$ 4.800",
    type: "CLT",
    posted: "Há 5 horas",
    applicants: 12,
    description: "Escolta armada para executivos e cargas especiais na região metropolitana do RJ.",
    requirements: ["Curso de Escolta Armada", "Porte de arma vigente", "CNH B"],
    benefits: ["Adicional noturno", "Hora extra", "Plano de saúde"],
  },
  {
    id: "supervisor-bh",
    title: "Supervisor de Segurança",
    company: "Sentinela MG",
    companyInitials: "SM",
    location: "Belo Horizonte, MG",
    shift: "Comercial",
    salary: "R$ 3.900",
    type: "CLT",
    posted: "Há 1 dia",
    applicants: 23,
    description: "Coordenar equipe de até 30 vigilantes em postos distribuídos pela região metropolitana.",
    requirements: ["Curso de Supervisor", "Experiência em liderança", "Disponibilidade de viagem"],
    benefits: ["Carro da empresa", "Plano de saúde família", "PLR"],
  },
  {
    id: "cftv-curitiba",
    title: "Operador de CFTV — Central 24h",
    company: "Olho Vivo Monitoramento",
    companyInitials: "OV",
    location: "Curitiba, PR",
    shift: "12x36",
    salary: "R$ 2.200",
    type: "CLT",
    posted: "Há 3 dias",
    applicants: 89,
    description: "Monitoramento de câmeras de clientes corporativos em central operacional moderna.",
    requirements: ["Curso de Operador de CFTV", "Conhecimento em sistemas Intelbras/Hikvision"],
    benefits: ["Vale refeição", "Convênio médico", "Café da manhã"],
  },
  {
    id: "eventos-floripa",
    title: "Segurança para Eventos Sociais",
    company: "Status Eventos",
    companyInitials: "SE",
    location: "Florianópolis, SC",
    shift: "Diárias",
    salary: "R$ 280/diária",
    type: "Diária",
    posted: "Há 6 horas",
    applicants: 34,
    description: "Segurança de festas, casamentos e eventos corporativos na grande Floripa.",
    requirements: ["Curso de Eventos Sociais", "Boa apresentação", "Disponibilidade fim de semana"],
    benefits: ["Pagamento no ato", "Refeição inclusa"],
  },
  {
    id: "porteiro-bsb",
    title: "Porteiro — Edifício Comercial",
    company: "Guardião DF",
    companyInitials: "GD",
    location: "Brasília, DF",
    shift: "12x36 Diurno",
    salary: "R$ 1.850 + benefícios",
    type: "CLT",
    posted: "Há 4 dias",
    applicants: 102,
    description: "Controle de acesso de visitantes e prestadores em edifício comercial classe A.",
    requirements: ["Curso de Porteiro", "Ensino médio completo"],
    benefits: ["Vale alimentação", "Vale transporte", "Plano odontológico"],
  },
] as Omit<Job, "cover">[]).map((j, i) => ({ ...j, cover: COVERS[i % COVERS.length] }));

export type Post = {
  id: string;
  author: string;
  role: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  type?: "text" | "image" | "video";
};

export const POSTS: Post[] = [
  {
    id: "p1",
    author: "Carlos Mendes",
    role: "Vigilante Líder · 8 anos de experiência",
    avatar: "CM",
    time: "Há 2h",
    content:
      "Mais um dia concluído com sucesso! Nossa equipe garantiu a segurança de um evento corporativo com mais de 500 convidados. Parabéns @renata.oliveira pela operação impecável no monitoramento. 🛡️",
    likes: 124,
    comments: 18,
    type: "text",
  },
  {
    id: "p2",
    author: "Águia Negra Segurança",
    role: "Empresa · Rio de Janeiro",
    avatar: "AN",
    time: "Há 5h",
    content:
      "Estamos com 12 novas vagas abertas para escolta armada na região metropolitana. Salários a partir de R$ 4.800 + benefícios. Inscreva-se na nossa página de vagas!",
    likes: 312,
    comments: 47,
    type: "text",
  },
  {
    id: "p3",
    author: "Renata Oliveira",
    role: "Operadora de CFTV · Curitiba",
    avatar: "RO",
    time: "Há 1d",
    content:
      "Concluí mais uma especialização em sistemas de monitoramento inteligente. A FORBIN abriu portas que eu nem imaginava existir. Obrigada pela confiança! 🎓",
    likes: 89,
    comments: 12,
    type: "text",
  },
  {
    id: "p4",
    author: "Marcos Tavares",
    role: "Supervisor de Segurança · BH",
    avatar: "MT",
    time: "Há 2d",
    content:
      "Treinamento de defesa pessoal com a equipe nova hoje. Reciclagem constante salva vidas — a nossa e a de quem protegemos.",
    likes: 201,
    comments: 33,
    type: "text",
  },
  {
    id: "p5",
    author: "Júlia Santos",
    role: "Escolta Armada · RJ",
    avatar: "JS",
    time: "Há 6h",
    content:
      "Evento concluído com sucesso no Maracanã RJ com a empresa @forcaelite 🏟️🛡️ Mais de 70 mil pessoas, equipe impecável, zero ocorrências. Orgulho de fazer parte!",
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1280&h=720&fit=crop",
    likes: 487,
    comments: 62,
    type: "image",
  },
  {
    id: "p6",
    author: "Pedro Almeida",
    role: "Bombeiro Civil · Salvador",
    avatar: "PA",
    time: "Há 12h",
    content:
      "Treinamento de combate a incêndio com a brigada nova. Preparação é o que separa a tragédia da resposta. 🔥",
    image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1280&h=720&fit=crop",
    likes: 256,
    comments: 28,
    type: "image",
  },
  {
    id: "p7",
    author: "Ana Costa",
    role: "Vigilante Líder · Brasília",
    avatar: "AC",
    time: "Há 1d",
    content:
      "Cobertura completa do show no estádio ontem com a @forcaelite. Equipe coesa faz toda a diferença em eventos de grande porte. 🎤",
    video: "https://cdn.coverr.co/videos/coverr-security-camera-at-night-3389/1080p.mp4",
    likes: 612,
    comments: 94,
    type: "video",
  },
];
