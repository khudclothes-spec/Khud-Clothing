"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  if (message.startsWith("SOLD_OUT|")) {
    const [, name] = message.split("|");
    return `${name || "An item in your bag"} is sold out — please remove it from your bag.`;
  }
  if (message.includes("NOT_AUTHENTICATED")) return "Not signed in";
  if (message.includes("EMPTY_CART")) return "Your bag is empty.";
  if (message.includes("INVALID_QUANTITY")) return "Please check the quantities in your bag.";
  return message;
}

const fallbackCart = {
  cart: [],
  cartCount: 0,
  hydrated: false,
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

const CART_STORAGE_KEY = "khud:cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  // `hydrated` flips true once we've read the persisted bag from localStorage.
  // Consumers (e.g. checkout) use it so they never flash "cart is empty" during
  // the first client render, before the saved cart has loaded.
  const [hydrated, setHydrated] = useState(false);
  const supabase = createClient();

  // Persist the bag to localStorage so it survives reloads AND the
  // login → back-to-checkout round trip (Phase 2: never lose cart contents).
  const skipPersist = useRef(true);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setCart(parsed);
      }
    } catch {
      // ignore corrupt/blocked storage
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (skipPersist.current) { skipPersist.current = false; return; }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore quota/private-mode errors
    }
  }, [cart]);

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
      // Defence in depth: Supabase already blocks unverified users from having a
      // session, but never let one reach checkout.
      if (!user.email_confirmed_at) {
        throw new Error("Please verify your email before placing an order.");
      }

      // Send only ids + quantities — price, totals and stock are revalidated
      // server-side, so a tampered cart cannot change what is charged or sold.
      const items = cart
        .filter((i) => i.variantId)
        .map((i) => ({ variant_id: i.variantId, quantity: i.qty }));

      if (items.length === 0) {
        throw new Error("Your bag has no purchasable items.");
      }

      // Street lines only — province / postal / country are their own snapshot
      // columns on the order now.
      const shippingAddress = [shipping.address_line1, shipping.address_line2].filter(Boolean).join(", ");
      const billingSame = shipping.billing_same !== false;
      const billingAddress = billingSame
        ? shippingAddress
        : [shipping.billing_address_line1, shipping.billing_address_line2].filter(Boolean).join(", ");

      console.info("[checkout] submitting", { items });

      const { data, error } = await supabase.rpc("process_checkout", {
        p_items: items,
        p_customer: {
          full_name: shipping.full_name,
          phone: shipping.phone,
          address: shippingAddress,
          city: shipping.city,
          state: shipping.state || null,
          postal_code: shipping.postal_code || null,
          country: shipping.country || "Pakistan",
          shipping_method: shipping.shipping_method || "standard",
          billing_name: billingSame ? shipping.full_name : (shipping.billing_name || shipping.full_name),
          billing_phone: billingSame ? shipping.phone : (shipping.billing_phone || shipping.phone),
          billing_address: billingAddress,
          billing_city: billingSame ? shipping.city : (shipping.billing_city || shipping.city),
          billing_state: billingSame ? shipping.state : (shipping.billing_state || null),
          billing_postal_code: billingSame ? shipping.postal_code : (shipping.billing_postal_code || null),
          billing_country: billingSame ? shipping.country : (shipping.billing_country || "Pakistan"),
          promo_code: shipping.promo_code || null,
          notes: shipping.notes || null,
          payment_method: shipping.payment_method === "online" ? "online" : "cod"
        }
      });

      if (error) {
        console.warn("[checkout] failed", { code: error.code, message: error.message });
        throw new Error(parseCheckoutError(error.message));
      }

      console.info("[checkout] success", data);
      // Clear the bag only when checkout is truly complete. COD is complete the
      // moment the order is created ('confirmed'), so clear now. Bank-transfer
      // orders still need a payment proof — the cart is cleared after that upload
      // (PaymentPageClient), so a customer who abandons before paying keeps their
      // bag. Everything up to completion — Back, refresh, leaving — is safe.
      if (data.status === "confirmed") {
        setCart([]);
      }

      // Notify (fire-and-forget) for EVERY placed order: the four owners get a
      // "new order" email now (COD or bank transfer); the customer gets their
      // confirmation only for COD. The route decides + is idempotent; we just
      // hand it the order id so the screen stays instant.
      fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.order_id })
      }).catch((e) => console.warn("[checkout] notify trigger failed", e));

      return {
        orderId: data.order_id,
        orderNumber: data.order_number,
        status: data.status,
        paymentMethod: data.payment_method,
        total: data.total
      };
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
      hydrated,
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
    [cart, cartCount, hydrated, subtotalNumber, cartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
