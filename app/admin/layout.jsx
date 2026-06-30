import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import Link from "next/link";

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
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src="/images/logo-white-writing.png" alt="Khud" className="admin-logo" />
        </div>

        <nav className="admin-sidebar__nav">
          <Link href="/admin" className="admin-nav-link">Products</Link>
          <Link href="/admin/categories" className="admin-nav-link">Categories</Link>
          <Link href="/admin/orders" className="admin-nav-link">Orders</Link>
          <Link href="/admin/storefront" className="admin-nav-link">Storefront</Link>

          <div className="admin-nav-group">Customization</div>
          <Link href="/admin/customization" className="admin-nav-link admin-nav-link--sub">
            Customizable Categories
          </Link>
          <Link href="/admin/customization/designs" className="admin-nav-link admin-nav-link--sub">
            Design Templates
          </Link>
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
