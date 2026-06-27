"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/data";

const fallbackCart = {
  cart: [],
  cartCount: 0,
  subtotal: formatPrice(0),
  cartOpen: false,
  openCart: () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("khud:open-cart"));
    }
  },
  closeCart: () => {},
  addItem: (item) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("khud:add-cart", { detail: item }));
    }
  },
  changeQty: () => {},
  removeItem: () => {}
};

const CartContext = createContext(fallbackCart);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addItem = useCallback((item) => {
    const key = item.key || item.name;
    setCart((items) => {
      const index = items.findIndex((entry) => entry.key === key);
      if (index < 0) {
        return [...items, { ...item, key, qty: 1 }];
      }

      return items.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, qty: entry.qty + 1 } : entry
      );
    });
    setCartOpen(true);
  }, []);

  const changeQty = useCallback((key, delta) => {
    setCart((items) =>
      items
        .map((entry) => (entry.key === key ? { ...entry, qty: entry.qty + delta } : entry))
        .filter((entry) => entry.qty > 0)
    );
  }, []);

  const removeItem = useCallback((key) => {
    setCart((items) => items.filter((entry) => entry.key !== key));
  }, []);

  useEffect(() => {
    function handleAdd(event) {
      if (event.detail) addItem(event.detail);
    }

    function handleOpen() {
      setCartOpen(true);
    }

    window.addEventListener("khud:add-cart", handleAdd);
    window.addEventListener("khud:open-cart", handleOpen);
    return () => {
      window.removeEventListener("khud:add-cart", handleAdd);
      window.removeEventListener("khud:open-cart", handleOpen);
    };
  }, [addItem]);

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);
  const subtotalNumber = cart.reduce((total, item) => total + item.price * item.qty, 0);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      subtotal: formatPrice(subtotalNumber),
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      addItem,
      changeQty,
      removeItem
    }),
    [cart, cartCount, subtotalNumber, cartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
