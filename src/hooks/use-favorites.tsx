import { useCallback, useEffect, useState } from "react";

const KEY = "forbin:favorites:v1";

export type FavoriteItem = {
  id: string;
  kind: "professional" | "company";
};

function read(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: FavoriteItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("forbin:favorites"));
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setItems(read());
    const handler = () => setItems(read());
    window.addEventListener("forbin:favorites", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("forbin:favorites", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isFavorite = useCallback(
    (id: string, kind: FavoriteItem["kind"]) =>
      items.some((i) => i.id === id && i.kind === kind),
    [items],
  );

  const toggle = useCallback((id: string, kind: FavoriteItem["kind"]) => {
    const current = read();
    const exists = current.some((i) => i.id === id && i.kind === kind);
    const next = exists
      ? current.filter((i) => !(i.id === id && i.kind === kind))
      : [...current, { id, kind }];
    write(next);
  }, []);

  return { items, isFavorite, toggle };
}
