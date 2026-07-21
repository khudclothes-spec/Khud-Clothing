"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Admin sidebar. On wide screens it's a fixed column; when the screen narrows it
// collapses off-canvas and a hamburger button toggles it, freeing the width for
// the editing area.
export function AdminSidebar({ displayName }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer after navigating.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="admin-menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-sidebar__brand">
          <img src="/images/charmeem-logo-gold.png" alt="Char Meem Clothing logo" className="admin-logo" />
        </div>

        <nav className="admin-sidebar__nav">
          <Link href="/admin" className="admin-nav-link">Products</Link>
          <Link href="/admin/categories" className="admin-nav-link">Categories</Link>
          <Link href="/admin/orders" className="admin-nav-link">Orders</Link>
          <Link href="/admin/promos" className="admin-nav-link">Promo Codes</Link>
          <Link href="/admin/students" className="admin-nav-link">Student Verification</Link>
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
    </>
  );
}
