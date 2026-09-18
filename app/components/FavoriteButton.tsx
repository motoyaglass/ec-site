"use client";

import { useFavorites } from "./FavoritesContext";

export default function FavoriteButton({ productId }: { productId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(productId);

  return (
    <button
      type="button"
      className={`favorite-btn ${active ? "active" : ""}`}
      aria-label={active ? "お気に入りから外す" : "お気に入りに追加"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(productId);
      }}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
