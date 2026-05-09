import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(system: string, user: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados.");
  if (!res.ok) {
    const txt = await res.text();
    console.error("AI gateway error", res.status, txt);
    throw new Error("Falha ao chamar a IA.");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export const generateJobDescription = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        idea: z.string().min(3).max(500),
        title: z.string().max(200).optional(),
        city: z.string().max(120).optional(),
        state: z.string().max(2).optional(),
        modality: z.string().max(40).optional(),
        contract_type: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const system = `Você é um recrutador especialista em segurança privada no Brasil.
Crie descrições de vaga completas, claras e profissionais em português BR.
Devolva APENAS o conteúdo descritivo (sem título, sem markdown de cabeçalhos com #), em parágrafos curtos com bullets quando fizer sentido, contendo:
Sobre a vaga, Responsabilidades, Requisitos, Diferenciais, Benefícios.
Use linguagem direta e respeitosa. Não invente nome de empresa nem CNPJ.`;
    const ctx = [
      data.title ? `Cargo: ${data.title}` : null,
      data.city || data.state ? `Local: ${[data.city, data.state].filter(Boolean).join("/")}` : null,
      data.modality ? `Modalidade: ${data.modality}` : null,
      data.contract_type ? `Contrato: ${data.contract_type}` : null,
      `Briefing: ${data.idea}`,
    ]
      .filter(Boolean)
      .join("\n");
    const text = await callAI(system, ctx);
    return { text };
  });

export const reviewResume = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        resume: z.string().min(20).max(20000),
        audience: z.enum(["professional", "company"]).default("professional"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const system =
      data.audience === "company"
        ? `Você é um analista de RH para empresas de segurança privada no Brasil.
Analise o currículo enviado e devolva, em Markdown português BR, uma análise voltada para o RECRUTADOR:
**Resumo do candidato** (3-4 linhas), **Experiência relevante**, **Formações e cursos**, **Pontos fortes**, **Pontos de atenção**, **Aderência para vagas de segurança privada** (Alta / Média / Baixa, com justificativa curta).`
        : `Você é um consultor de carreira para profissionais de segurança privada no Brasil.
Analise o currículo do usuário e devolva, em Markdown português BR:
**Pontos fortes**, **Pontos a melhorar**, **Sugestão de texto reescrito** (versão profissional pronta para usar), **Palavras-chave recomendadas**.
Seja construtivo, objetivo e específico para a área de segurança.`;
    const text = await callAI(system, data.resume);
    return { text };
  });
