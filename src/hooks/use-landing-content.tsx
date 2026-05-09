import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PREFIX = "landing.";

export type LandingContent = Record<string, string>;

export const LANDING_DEFAULTS: LandingContent = {
  hero_eyebrow: "Nova era para segurança privada",
  hero_title_1: "Sua próxima",
  hero_title_highlight: "missão profissional",
  hero_title_2: "começa aqui.",
  hero_subtitle:
    "FORBIN MultiEmpresas conecta vigilantes, supervisores, escoltas e empresas do setor em uma plataforma feita para quem leva segurança a sério.",
  hero_cta_pro: "Sou profissional",
  hero_cta_company: "Sou empresa",
  hero_image: "",
  stat1_value: "2.4k+",
  stat1_label: "Profissionais",
  stat2_value: "380+",
  stat2_label: "Empresas",
  stat3_value: "1.2k+",
  stat3_label: "Vagas ativas",
  how_eyebrow: "Como funciona",
  how_title: "Três passos para começar",
  how_step1_title: "Cadastre seu perfil",
  how_step1_desc:
    "Monte um currículo completo: cursos, experiência, foto e dados pessoais. Tudo em passos simples.",
  how_step2_title: "Encontre oportunidades",
  how_step2_desc:
    "Veja vagas no marketplace, filtre por região e função, e candidate-se com um clique.",
  how_step3_title: "Conecte-se com empresas",
  how_step3_desc:
    "Empresas analisam seu perfil e marcam reuniões direto pelo painel. Simples e direto.",
  jobs_eyebrow: "Marketplace",
  jobs_title: "Vagas em destaque",
  jobs_subtitle:
    "Oportunidades publicadas por empresas verificadas, atualizadas em tempo real.",
  company_eyebrow: "Para empresas",
  company_title: "Recrute profissionais qualificados em minutos.",
  company_subtitle:
    "Publique vagas, receba candidaturas filtradas pelo seu painel admin e marque reuniões diretamente com os candidatos.",
  cta_title: "Pronto para a próxima missão?",
  cta_subtitle:
    "Cadastre-se gratuitamente e comece a se conectar com as melhores empresas de segurança privada do Brasil.",
  cta_btn_primary: "Criar conta grátis",
  cta_btn_secondary: "Explorar vagas",
};

export function useLandingContent() {
  const [content, setContent] = useState<LandingContent>(LANDING_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .like("key", `${PREFIX}%`);
      const merged: LandingContent = { ...LANDING_DEFAULTS };
      (data ?? []).forEach((row: any) => {
        const k = row.key.slice(PREFIX.length);
        if (row.value != null) merged[k] = row.value;
      });
      setContent(merged);
      setLoading(false);
    })();
  }, []);

  return { content, loading };
}

export const LANDING_PREFIX = PREFIX;
