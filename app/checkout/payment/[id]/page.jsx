import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { PaymentPageClient } from "@/components/checkout/PaymentPageClient";

export const metadata = { title: "Complete payment — Khud", robots: "noindex" };

export default async function PaymentPage({ params }) {
  const { id } = await params;
  const supabase = await createServerClient();

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    user = null;
  }
  if (!user) redirect(`/login?redirect=/checkout/payment/${id}`);

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, subtotal, promo_discount, discount_amount, shipping_cost, tax, payment_method, status")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!order) notFound();
  // COD (or any non-online) order — nothing to pay here.
  if (order.payment_method !== "online") redirect(`/account/orders/${order.id}`);

  const { data: pv } = await supabase
    .from("payment_verifications")
    .select("payment_status")
    .eq("order_id", order.id)
    .maybeSingle();

  return (
    <PaymentPageClient
      orderId={order.id}
      orderNumber={order.order_number}
      totalAmount={order.total_amount}
      initialStatus={pv?.payment_status ?? "pending"}
    />
  );
}
