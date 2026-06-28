import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import Link from "next/link";

export const metadata = {
  title: "Admin",
  robots: "noindex"
};

export default async function AdminLayout({ children }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src="/images/logo-white-writing.png" alt="Khud" className="admin-logo" />
        </div>

        <nav className="admin-sidebar__nav">
          <Link href="/admin" className="admin-nav-link">Products</Link>
          <Link href="/admin/categories" className="admin-nav-link">Categories</Link>
          <Link href="/admin/orders" className="admin-nav-link">Orders</Link>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user-name">{displayName}</div>
          <Link href="/" className="admin-exit-link">← Back to site</Link>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
