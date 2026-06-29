"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/data";
import { createClient } from "@/lib/supabase";

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

  // Returns { orderId } on success, throws on failure
  const placeOrder = useCallback(
    async (shipping) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const subtotalNumber = cart.reduce((t, i) => t + i.price * i.qty, 0);
      const totalAmount = subtotalNumber; // no tax / shipping cost for now

      // Combine address lines + province + postal into a single TEXT field
      const shippingAddress = [
        shipping.address_line1,
        shipping.address_line2,
        shipping.state,
        shipping.postal_code
      ].filter(Boolean).join(", ");

      // Generate a short unique order number
      const orderNumber = `KHD-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          profile_id: user.id,
          order_number: orderNumber,
          status: "pending",
          customer_name: shipping.full_name,
          customer_phone: shipping.phone,
          customer_email: user.email,
          shipping_address: shippingAddress,
          city: shipping.city,
          subtotal: subtotalNumber,
          shipping_cost: 0,
          total_amount: totalAmount
        })
        .select("id")
        .single();

      if (orderError) throw new Error(orderError.message);

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id ?? null,
        variant_id: item.variantId ?? null,
        unit_price: item.price,
        quantity: item.qty,
        size: item.size ?? null,
        color: item.color ?? null
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw new Error(itemsError.message);

      setCart([]);
      return { orderId: order.id };
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
