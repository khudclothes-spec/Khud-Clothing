"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/data";
import { createClient } from "@/lib/supabase";

// Turn the pipe-delimited error raised by the process_checkout RPC into a
// shopper-friendly message. The cart is never trusted, so the DB is the one
// that tells us exactly how much stock is actually left.
function parseCheckoutError(message) {
  if (!message) return "Something went wrong placing your order. Please try again.";
  if (message.startsWith("OUT_OF_STOCK|")) {
    const [, name, color, size, available] = message.split("|");
    const variant = [color, size].filter(Boolean).join(" · ");
    const left = Number(available) || 0;
    const label = `${name}${variant ? ` (${variant})` : ""}`;
    return left <= 0
      ? `${label} just sold out — please remove it from your bag.`
      : `Only ${left} left of ${label}. Please reduce the quantity in your bag.`;
  }
  if (message.startsWith("VARIANT_NOT_FOUND")) {
    return "An item in your bag is no longer available. Please remove it and try again.";
  }
  if (message.includes("NOT_AUTHENTICATED")) return "Not signed in";
  if (message.includes("EMPTY_CART")) return "Your bag is empty.";
  if (message.includes("INVALID_QUANTITY")) return "Please check the quantities in your bag.";
  return message;
}

const fallbackCart = {
  cart: [],
  cartCount: 0,
  subtotal: formatPrice(0),
  subtotalNumber: 0,
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
  removeItem: () => {},
  clearCart: () => {},
  placeOrder: async () => {}
};

const CartContext = createContext(fallbackCart);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const supabase = createClient();

  const addItem = useCallback((item) => {
    const key = item.key || item.name;
    setCart((items) => {
      const index = items.findIndex((entry) => entry.key === key);
      if (index < 0) {
        return [...items, { ...item, key, qty: 1 }];
      }
      return items.map((entry, i) =>
        i === index ? { ...entry, qty: entry.qty + 1 } : entry
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

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Returns { orderId, orderNumber } on success, throws on failure.
  // The whole checkout runs server-side in the process_checkout RPC: a single
  // DB transaction that locks each variant row (FOR UPDATE), verifies stock,
  // decrements it, and writes the order + items atomically. Stock is only ever
  // reserved here, at checkout — never when items are added to the cart.
  const placeOrder = useCallback(
    async (shipping) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Send only ids + quantities — price, totals and stock are revalidated
      // server-side, so a tampered cart cannot change what is charged or sold.
      const items = cart
        .filter((i) => i.variantId)
        .map((i) => ({ variant_id: i.variantId, quantity: i.qty }));

      if (items.length === 0) {
        throw new Error("Your bag has no purchasable items.");
      }

      // Combine address lines + province + postal into a single TEXT field.
      const shippingAddress = [
        shipping.address_line1,
        shipping.address_line2,
        shipping.state,
        shipping.postal_code
      ].filter(Boolean).join(", ");

      console.info("[checkout] submitting", { items });

      const { data, error } = await supabase.rpc("process_checkout", {
        p_items: items,
        p_customer: {
          full_name: shipping.full_name,
          phone: shipping.phone,
          address: shippingAddress,
          city: shipping.city,
          notes: null
        }
      });

      if (error) {
        console.warn("[checkout] failed", { code: error.code, message: error.message });
        throw new Error(parseCheckoutError(error.message));
      }

      console.info("[checkout] success", data);
      setCart([]);
      return { orderId: data.order_id, orderNumber: data.order_number };
    },
    [cart]
  );

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

  const cartCount = cart.reduce((t, i) => t + i.qty, 0);
  const subtotalNumber = cart.reduce((t, i) => t + i.price * i.qty, 0);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      subtotal: formatPrice(subtotalNumber),
      subtotalNumber,
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      addItem,
      changeQty,
      removeItem,
      clearCart,
      placeOrder
    }),
    [cart, cartCount, subtotalNumber, cartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
