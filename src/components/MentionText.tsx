import { Link } from "@tanstack/react-router";
import { findProfileByHandle } from "@/data/profiles";

/**
 * Renderiza texto convertendo @handle em link clicável para o perfil.
 * Se o handle não existir, mantém como texto destacado.
 */
export function MentionText({ children }: { children: string }) {
  const parts = children.split(/(@[a-zA-Z0-9._-]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const profile = findProfileByHandle(part);
          if (profile) {
            return (
              <Link
                key={i}
                to="/u/$handle"
                params={{ handle: profile.handle }}
                className="font-semibold text-primary hover:underline"
              >
                {part}
              </Link>
            );
          }
          return (
            <span key={i} className="font-semibold text-primary">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
