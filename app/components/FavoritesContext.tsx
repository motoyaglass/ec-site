"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

type FavoritesContextValue = {
  ids: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const STORAGE_KEY = "ec-site-favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 初回マウント時にlocalStorageから復元
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds(parsed.filter((v) => typeof v === "string"));
      }
    } catch {
      // 壊れたデータは無視
    }
    setLoaded(true);
  }, []);

  // 変更のたびにlocalStorageへ保存(初回ロード完了後のみ)
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // 保存に失敗しても致命的ではないので無視
    }
  }, [ids, loaded]);

  const toggleFavorite = useCallback((productId: string) => {
    setIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const removeFavorite = useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const isFavorite = useCallback((productId: string) => ids.includes(productId), [ids]);

  const value: FavoritesContextValue = useMemo(
    () => ({ ids, isFavorite, toggleFavorite, removeFavorite }),
    [ids, isFavorite, toggleFavorite, removeFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
