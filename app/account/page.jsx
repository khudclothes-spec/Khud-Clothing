import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export const metadata = {
  title: "My Account",
  robots: "noindex"
};

// Customer dashboard. Server-gated: signed-in users only. Reads the profile and
// the user's own orders (RLS scopes both to auth.uid()).
export default async function AccountPage() {
  const supabase = await createServerClient();

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    user = null;
  }
  if (!user) redirect("/login?redirect=/account");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, address_line1, address_line2, city, state, postal_code, country, student_verified, student_email, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, order_number, status, total_amount, payment_method, created_at, order_items(quantity, unit_price, size, color, products(name, slug))")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  const orderList = orders ?? [];
  const totalOrders = orderList.length;
  const totalSpent = orderList
    .filter((o) => o.status !== "cancelled")
    .reduce((t, o) => t + (Number(o.total_amount) || 0), 0);

  const initialProfile = {
    fullName: profile?.full_name ?? "",
    email: user.email ?? "",
    phone: profile?.phone ?? "",
    addressLine1: profile?.address_line1 ?? "",
    addressLine2: profile?.address_line2 ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    postalCode: profile?.postal_code ?? "",
    country: profile?.country ?? "Pakistan",
    createdAt: profile?.created_at ?? null,
    studentVerified: profile?.student_verified === true,
    studentEmail: profile?.student_email ?? ""
  };

  return (
    <AccountDashboard
      profile={initialProfile}
      orders={orderList}
      stats={{ totalOrders, totalSpent }}
    />
  );
}
