import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { AdminSidebar } from "@/components/AdminSidebar";

export const metadata = {
  title: "Admin",
  robots: "noindex"
};

export default async function AdminLayout({ children }) {
  const supabase = await createServerClient();

  // A stale/missing refresh token can make getUser throw
  // (refresh_token_not_found). Treat any failure as "not signed in".
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    user = null;
  }

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/");

  const displayName = profile.full_name || user.email;

  return (
    <div className="admin-root">
      <AdminSidebar displayName={displayName} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
