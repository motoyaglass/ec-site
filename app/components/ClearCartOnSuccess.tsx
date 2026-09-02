"use client";

import { useEffect } from "react";
import { useCart } from "./CartContext";

export default function ClearCartOnSuccess({ success }: { success: boolean }) {
  const { clear } = useCart();

  useEffect(() => {
    if (success) {
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  return null;
}
