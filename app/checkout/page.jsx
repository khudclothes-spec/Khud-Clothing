import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata = { title: "Checkout", robots: "noindex" };

// Auth-gated dedicated checkout. Not signed in → login, then straight back here
// (the cart persists across the round trip via CartProvider localStorage).
export default async function CheckoutPage() {
  const supabase = await createServerClient();

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    user = null;
  }
  if (!user) redirect("/login?redirect=/checkout");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, address_line1, address_line2, city, state, postal_code, country, student_verified")
    .eq("id", user.id)
    .maybeSingle();

  const initial = {
    full_name: profile?.full_name ?? "",
    email: user.email ?? "",
    phone: profile?.phone ?? "",
    address_line1: profile?.address_line1 ?? "",
    address_line2: profile?.address_line2 ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    postal_code: profile?.postal_code ?? "",
    country: profile?.country ?? "Pakistan",
    studentVerified: profile?.student_verified === true
  };

  return <CheckoutClient initial={initial} />;
}
