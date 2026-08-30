// src/contexts/WishlistContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "fashion_wishlist";

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isWishlisted = (productId) =>
    items.some((i) => i.id === productId);

  const toggleWishlist = (product) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === product.id)) {
        return prev.filter((i) => i.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{ items, isWishlisted, toggleWishlist, removeFromWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};