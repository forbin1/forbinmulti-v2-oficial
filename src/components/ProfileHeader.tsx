import { useRef, useState } from "react";
import { Camera, Loader2, Lock, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LevelBadge } from "@/components/LevelBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ImageCropModal } from "@/components/ImageCropModal";
import type { LevelTier } from "@/lib/professional-level";
import { cn } from "@/lib/utils";

export type ProfileStat = { label: string; value: string };
export type ProfileMeta = { icon: LucideIcon; text: string };

type Props = {
  name: string;
  initials: string;
  subtitle?: string;
  eyebrow?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  verified?: boolean;
  verifiedLabel?: string;
  levelTier?: LevelTier;
  whatsapp?: string | null;
  meta?: ProfileMeta[];
  stats?: ProfileStat[];
  isOwner?: boolean;
  uploading?: "avatar" | "cover" | null;
  onPickAvatar?: (file: File) => void;
  onPickCover?: (file: File) => void;
  /** Botões extras (editar, compartilhar, painel...). */
  actions?: React.ReactNode;
  /** Quando true, o contato (WhatsApp) fica bloqueado (sem plano ativo). */
  contactLocked?: boolean;
};

export function ProfileHeader({
  name,
  initials,
  subtitle,
  eyebrow,
  avatarUrl,
  coverUrl,
  verified,
  verifiedLabel = "Verificado",
  levelTier,
  whatsapp,
  meta = [],
  stats = [],
  isOwner = false,
  uploading = null,
  onPickAvatar,
  onPickCover,
  actions,
  contactLocked = false,
}: Props) {
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [cropTarget, setCropTarget] = useState<{ file: File; kind: "avatar" | "cover" } | null>(null);

  const waDigits = whatsapp?.replace(/\D/g, "") || "";
  const waHref = waDigits ? `https://wa.me/${waDigits.length > 11 ? waDigits : `55${waDigits}`}` : null;

  const whatsappBtn = contactLocked ? (
    <Button
      asChild
      className="h-11 rounded-full bg-muted px-5 font-bold text-muted-foreground hover:bg-muted/80"
    >
      <Link to="/minha-assinatura">
        <Lock className="mr-2 h-4 w-4" /> Assine para ver contato
      </Link>
    </Button>
  ) : waHref ? (
    <Button
      asChild
      className="h-11 rounded-full bg-[#25D366] px-5 font-bold text-white shadow-md shadow-[#25D366]/20 hover:bg-[#1fb858]"
    >
      <a href={waHref} target="_blank" rel="noreferrer">
        <WhatsAppIcon className="mr-2 h-4 w-4 text-white" /> WhatsApp
      </a>
    </Button>
  ) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:rounded-3xl">
      {/* Capa */}
      <div className="relative h-32 sm:h-52 lg:h-60">
        {coverUrl ? (
          <img src={coverUrl} alt="Capa" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-amber-900 via-neutral-900 to-black">
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-20%,rgba(212,175,55,0.22),transparent_60%)]" />
          </div>
        )}
        {isOwner && (
          <>
            <button
              type="button"
              onClick={() => coverInput.current?.click()}
              disabled={!!uploading}
              className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-neutral-900/90 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-neutral-900 disabled:opacity-60"
            >
              {uploading === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <span>Alterar capa</span>
            </button>
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) setCropTarget({ file: f, kind: "cover" });
              }}
            />
          </>
        )}
      </div>

      {/* Corpo */}
      <div className="px-4 pb-5 sm:px-8 sm:pb-7">
        <div className="flex flex-col items-center -mt-12 sm:-mt-16 sm:flex-row sm:items-end sm:gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-gradient-to-br from-primary to-amber-500 font-display text-3xl font-extrabold text-primary-foreground shadow-xl sm:h-28 sm:w-28 sm:text-4xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                  disabled={!!uploading}
                  className="absolute bottom-0.5 right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-card bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60"
                  aria-label="Alterar foto"
                >
                  {uploading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) setCropTarget({ file: f, kind: "avatar" });
                  }}
                />
              </>
            )}
          </div>

          {/* Identidade */}
          <div className="mt-3 min-w-0 flex-1 text-center sm:mt-0 sm:pb-1 sm:text-left">
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
            )}
            <h1 className="font-display text-xl font-black tracking-tight sm:text-3xl">{name}</h1>
            {(verified || (levelTier && levelTier !== "none")) && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                {verified && <VerifiedBadge size="sm" label={verifiedLabel} />}
                {levelTier && levelTier !== "none" && <LevelBadge tier={levelTier} size="sm" />}
              </div>
            )}
            {subtitle && <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">{subtitle}</p>}
          </div>

          {/* Ações (desktop) */}
          {(whatsappBtn || actions) && (
            <div className="hidden shrink-0 items-center gap-2 sm:flex sm:pb-1">
              {whatsappBtn}
              {actions}
            </div>
          )}
        </div>

        {/* Meta */}
        {meta.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground sm:justify-start sm:text-sm">
            {meta.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <m.icon className="h-3.5 w-3.5 text-primary" /> {m.text}
              </span>
            ))}
          </div>
        )}

        {/* Ações (mobile) */}
        {(whatsappBtn || actions) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:hidden [&>*]:flex-1 [&>a]:flex-1">
            {whatsappBtn}
            {actions}
          </div>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <div
            className={cn(
              "mt-5 grid gap-2 border-t border-border pt-4 text-center",
              stats.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-surface px-2 py-3">
                <p className="font-display text-xl font-black tracking-tight text-primary sm:text-2xl">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {cropTarget && (
        <ImageCropModal
          file={cropTarget.file}
          aspect={cropTarget.kind === "avatar" ? 1 : 16 / 6}
          cropShape={cropTarget.kind === "avatar" ? "round" : "rect"}
          title={cropTarget.kind === "avatar" ? "Ajustar foto de perfil" : "Ajustar foto de capa"}
          maxWidth={cropTarget.kind === "avatar" ? 600 : 1600}
          maxHeight={cropTarget.kind === "avatar" ? 600 : 900}
          onCancel={() => setCropTarget(null)}
          onConfirm={(croppedFile) => {
            if (cropTarget.kind === "avatar") onPickAvatar?.(croppedFile);
            else onPickCover?.(croppedFile);
            setCropTarget(null);
          }}
        />
      )}
    </div>
  );
}
