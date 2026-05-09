import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Loader2, Copy, Check, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { reviewResume } from "@/server/ai-tools.functions";

export const Route = createFileRoute("/revisor-curriculo")({
  head: () => ({
    meta: [
      { title: "Revisor de Currículo com IA — FORBIN" },
      {
        name: "description",
        content:
          "Faça upload do seu currículo em PDF ou texto e receba uma análise inteligente focada em segurança privada.",
      },
    ],
  }),
  component: RevisorPage,
});

function RevisorPage() {
  const { role } = useAuth();
  const audience: "company" | "professional" = role === "company" ? "company" : "professional";

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB)");
      return;
    }
    setFileName(file.name);
    setExtracting(true);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const extracted = await extractPdfText(file);
        setText(extracted);
        toast.success("PDF lido com sucesso");
      } else {
        const t = await file.text();
        setText(t);
        toast.success("Arquivo carregado");
      }
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível ler o arquivo. Cole o texto manualmente.");
    } finally {
      setExtracting(false);
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const clearFile = () => {
    setFileName(null);
    setText("");
    setOutput("");
  };

  const run = async () => {
    if (text.trim().length < 30) {
      toast.error("Adicione mais conteúdo do currículo (mín. 30 caracteres).");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const r = await reviewResume({ data: { resume: text.trim().slice(0, 19000), audience } });
      setOutput(r.text);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao analisar");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Análise por IA
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Revisor de Currículo
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {audience === "company"
            ? "Envie o currículo de um candidato e receba uma análise rápida com aderência para vagas de segurança privada."
            : "Envie seu currículo em PDF ou cole o texto. A IA vai apontar melhorias e sugerir uma versão mais profissional."}
        </p>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
        <label
          htmlFor="cv-file"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 bg-surface/40 px-6 py-10 text-center transition hover:border-primary/60 hover:bg-surface"
        >
          {fileName ? (
            <div className="flex w-full max-w-sm items-center justify-between rounded-xl bg-card px-4 py-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate">{fileName}</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); clearFile(); }}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Arraste o PDF aqui ou clique para enviar</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF ou TXT — até 10MB</p>
            </>
          )}
          <input
            id="cv-file"
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="hidden"
            onChange={onPickFile}
          />
        </label>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border/60" />
          ou cole o texto
          <span className="h-px flex-1 bg-border/60" />
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Cole aqui o conteúdo do currículo..."
          className="resize-y rounded-xl border-border/70 bg-surface text-sm"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {extracting ? "Lendo arquivo..." : `${text.length.toLocaleString("pt-BR")} caracteres`}
          </span>
          <Button
            onClick={run}
            disabled={loading || extracting}
            className="rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Analisar com IA</>
            )}
          </Button>
        </div>

        {output && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                Análise da IA
              </h3>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={copy}>
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-strong:text-primary prose-li:text-foreground">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function extractPdfText(file: File): Promise<string> {
  // Lazy-load pdfjs no cliente
  const pdfjs = await import("pdfjs-dist");
  // worker via CDN para evitar problemas de bundling
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  const pages = Math.min(doc.numPages, 20);
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    out += strings + "\n\n";
  }
  return out.trim();
}
