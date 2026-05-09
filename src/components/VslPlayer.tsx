import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * VSL Player — autoplay, sem controles, sem pause.
 * Inicia em mute (exigência dos navegadores) e desmuda no primeiro
 * gesto do usuário (clique/scroll/touch). pointer-events: none
 * impede pause por clique no vídeo.
 */
export function VslPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "vsl_url")
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.value) setSrc(data.value);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!src) return;
    const tryUnmute = () => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = false;
      v.volume = 1;
      v.play().catch(() => {});
      setMuted(false);
      window.removeEventListener("pointerdown", tryUnmute);
      window.removeEventListener("touchstart", tryUnmute);
      window.removeEventListener("scroll", tryUnmute);
      window.removeEventListener("keydown", tryUnmute);
    };
    window.addEventListener("pointerdown", tryUnmute, { once: true });
    window.addEventListener("touchstart", tryUnmute, { once: true });
    window.addEventListener("scroll", tryUnmute, { once: true });
    window.addEventListener("keydown", tryUnmute, { once: true });
    return () => {
      window.removeEventListener("pointerdown", tryUnmute);
      window.removeEventListener("touchstart", tryUnmute);
      window.removeEventListener("scroll", tryUnmute);
      window.removeEventListener("keydown", tryUnmute);
    };
  }, [src]);

  // Garante que o vídeo nunca fique pausado
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPause = () => {
      v.play().catch(() => {});
    };
    v.addEventListener("pause", onPause);
    return () => v.removeEventListener("pause", onPause);
  }, [src]);

  if (!src) return null;

  return (
    <div className="relative mb-6 w-full overflow-hidden rounded-2xl border border-primary/30 bg-black shadow-gold">
      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted={muted}
          playsInline
          {...({ "webkit-playsinline": "true" } as Record<string, string>)}
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen"
          onContextMenu={(e) => e.preventDefault()}
          className="pointer-events-none h-full w-full object-cover"
        />
        {muted && (
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = false;
              v.volume = 1;
              v.play().catch(() => {});
              setMuted(false);
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white"
          >
            Toque para ativar o som
          </button>
        )}
      </div>
    </div>
  );
}
