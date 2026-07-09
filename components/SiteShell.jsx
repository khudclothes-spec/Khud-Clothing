"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CartProvider, useCart } from "@/components/CartContext";
import { ArrowRight, Bag, Close, Menu, ChevronDown, User, LogOut, Dashboard } from "@/components/Icons";
import { TeeGraphic } from "@/components/TeeGraphic";
import { navLinks, formatPrice } from "@/lib/data";
import { createClient } from "@/lib/supabase";
import { itemsToFreeShipping, FREE_SHIPPING_MIN_ITEMS } from "@/lib/pricing";

const blackLogo = "/images/logo-black-writing.png";
const whiteLogo = "/images/logo-white-writing.png";

export function SiteShell({ children }) {
  return (
    <CartProvider>
      <ShellChrome>{children}</ShellChrome>
    </CartProvider>
  );
}

function ShellChrome({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const timers = useRef([]);
  const fromPath = useRef(null);
  const pendingHref = useRef(null);
  const coverStart = useRef(0);
  const revealObserver = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [phase, setPhase] = useState("");
  const { cartCount, openCart } = useCart();
  const [authUser, setAuthUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [shopCategories, setShopCategories] = useState([]);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", userId)
      .maybeSingle();
    setIsAdmin(data?.role === "admin");
    setProfileName(data?.full_name ?? "");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsAdmin(false);
        setProfileName("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Footer "Shop" column: up to 3 admin-selected categories (show_in_footer).
  useEffect(() => {
    supabase
      .from("categories")
      .select("name, slug")
      .eq("is_active", true)
      .eq("show_in_footer", true)
      .order("name")
      .limit(3)
      .then(({ data }) => setShopCategories(data ?? []));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthUser(null);
    setIsAdmin(false);
    setProfileName("");
    router.push("/");
  }

  // Display name: profile full_name, else the email prefix
  const displayName = profileName || authUser?.email?.split("@")[0] || "Account";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Reveal the page only once the new route has actually committed (its server
  // data is loaded), so the 3-panel transition never finishes before the page
  // swaps. A safety timer in navigate() guards against a stalled navigation.
  useEffect(() => {
    if (!pendingHref.current) return;
    if (pathname === fromPath.current) return; // navigation not committed yet

    pendingHref.current = null;
    const MIN_COVER = 720; // keep covered until the panels finish drawing down
    const elapsed = Date.now() - coverStart.current;
    const hold = Math.max(120, MIN_COVER - elapsed);

    timers.current.push(
      setTimeout(() => setPhase("is-revealing"), hold),
      setTimeout(() => setPhase(""), hold + 580)
    );
  }, [pathname]);

  useEffect(() => {
    revealObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "-40px 0px" }
    );

    document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => {
      revealObserver.current.observe(el);
    });

    return () => revealObserver.current?.disconnect();
  }, [pathname]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function isActive(href) {
    if (href === "/") return pathname === "/";
    if (href === "/size-guide") return pathname === "/size-guide" || pathname === "/size";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function navigate(href) {
    if (isActive(href)) {
      setMenuOpen(false);
      return;
    }

    timers.current.forEach((timer) => clearTimeout(timer));
    fromPath.current = pathname;
    pendingHref.current = href;
    coverStart.current = Date.now();
    setPhase("is-covering");

    timers.current = [
      // Kick off the route fetch right away so it loads *under* the cover.
      setTimeout(() => router.push(href), 80),
      // Safety net: if the navigation never commits, reveal anyway.
      setTimeout(() => {
        if (!pendingHref.current) return;
        pendingHref.current = null;
        setPhase("is-revealing");
        timers.current.push(setTimeout(() => setPhase(""), 580));
      }, 3500)
    ];
  }

  function handleLink(event, href) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(href);
  }

  return (
    <div className="site-root">
      <div className={`page-transition ${phase}`}>
        <div className="pt-panel" />
        <div className="pt-panel" />
        <div className="pt-panel" />
        <img src="/images/logo-white-writing.png" alt="Khud" className="pt-logo" />
      </div>

      <div className="announcement" aria-label="Announcements">
        <div className="announcement__track">
          {Array.from({ length: 2 }).map((_, index) => (
            <span key={index} style={{ display: "inline-flex", gap: 52 }}>
              <span>Drop 01 / Summer '26</span>
              <span className="announcement__spark">*</span>
              <span>Free Shipping on {FREE_SHIPPING_MIN_ITEMS}+ Items</span>
              <span className="announcement__spark">*</span>
              <span>Custom Orders Open</span>
              <span className="announcement__spark">*</span>
              <span>Printed Locally</span>
              <span className="announcement__spark">*</span>
            </span>
          ))}
        </div>
      </div>

      <header className="site-header">
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/" onClick={(event) => handleLink(event, "/")} className="logo-link" aria-label="Khud home">
            <img src={blackLogo} alt="Khud" className="logo" />
          </Link>

          <div className="nav-actions">
            <div className="desktop-nav">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleLink(event, link.href)}
                  className={`nav-link ${isActive(link.href) ? "is-active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {authUser ? (
              <UserMenu
                displayName={displayName}
                isAdmin={isAdmin}
                onLogout={handleLogout}
                onNavigate={navigate}
              />
            ) : (
              <Link href="/login" className="nav-auth-btn">
                Sign In
              </Link>
            )}

            <button type="button" className="icon-button" onClick={openCart} aria-label="Open cart">
              <Bag />
              {cartCount > 0 ? <span className="cart-count">{cartCount}</span> : null}
            </button>

            <button
              type="button"
              className="icon-button burger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
          </div>
        </nav>
      </header>

      {menuOpen ? (
        <div className="mobile-menu">
          <button type="button" className="overlay" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div className="mobile-menu__panel">
            <div className="mobile-menu__head">
              <img src={blackLogo} alt="Khud" className="logo logo--small" />
            </div>
            <div className="mobile-menu__links">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleLink(event, link.href)}
                  className={`mobile-menu__link ${isActive(link.href) ? "is-active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={(event) => handleLink(event, "/admin")}
                  className={`mobile-menu__link ${isActive("/admin") ? "is-active" : ""}`}
                >
                  Admin
                </Link>
              )}
              {authUser ? (
                <button
                  type="button"
                  className="mobile-menu__link mobile-menu__link--btn"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={(event) => handleLink(event, "/login")}
                  className={`mobile-menu__link ${isActive("/login") ? "is-active" : ""}`}
                >
                  Sign In
                </Link>
              )}
            </div>
            <div className="mobile-menu__foot">
              <img src={blackLogo} alt="" className="logo" style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>
      ) : null}

      {children}

      <Footer handleLink={handleLink} shopCategories={shopCategories} />
      <CartDrawer navigate={navigate} authUser={authUser} />
    </div>
  );
}

function UserMenu({ displayName, isAdmin, onLogout, onNavigate }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const initial = displayName?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className={`user-badge ${open ? "is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="user-badge__avatar" aria-hidden="true">{initial}</span>
        <span className="user-badge__name">{displayName}</span>
        <span className="user-badge__chevron"><ChevronDown size={12} /></span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="user-dropdown"
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="user-dropdown__header">
              <div className="user-dropdown__avatar" aria-hidden="true">{initial}</div>
              <div className="user-dropdown__name">{displayName}</div>
            </div>

            <button
              type="button"
              className="user-dropdown__item"
              role="menuitem"
              onClick={() => { setOpen(false); onNavigate("/account"); }}
            >
              <User size={15} />
              My Account
            </button>

            {isAdmin && (
              <button
                type="button"
                className="user-dropdown__item"
                role="menuitem"
                onClick={() => { setOpen(false); onNavigate("/admin"); }}
              >
                <Dashboard size={15} />
                Admin Dashboard
              </button>
            )}

            <button
              type="button"
              className="user-dropdown__item user-dropdown__item--danger"
              role="menuitem"
              onClick={() => { setOpen(false); onLogout(); }}
            >
              <LogOut size={15} />
              Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Footer({ handleLink, shopCategories = [] }) {
  // Shop column: "All categories" + up to 3 admin-selected footer categories.
  const shopLinks = [
    { label: "All categories", href: "/shop" },
    ...shopCategories.slice(0, 3).map((c) => ({ label: c.name, href: `/shop/${c.slug}` }))
  ];
  const studioLinks = [
    { label: "Customize", href: "/customize" },
    { label: "About", href: "/about" },
    { label: "Size Guide", href: "/size-guide" }
  ];

  // Placeholder social links — swap the href values in once the handles are live.
  const socials = [
    { label: "Instagram", href: "#" },
    { label: "WhatsApp", href: "#" }
  ];

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          <div>
            <img src={whiteLogo} alt="Khud" className="logo--footer" />
            <p className="footer-copy">
              Premium ready-made clothing and a custom-print studio. Design yourself.
            </p>
          </div>

          <FooterColumn title="Shop" links={shopLinks} handleLink={handleLink} />
          <FooterColumn title="Studio" links={studioLinks} handleLink={handleLink} />

          <div>
            <div className="footer-title">Connect</div>
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.label}
              </a>
            ))}
            <a href="mailto:khudclothes@gmail.com" className="footer-text" style={{ marginTop: 10 }}>
              khudclothes@gmail.com
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>(c) 2026 Khud. All rights reserved.</span>
          <span>Islamabad and nationwide shipping</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links, handleLink }) {
  return (
    <div>
      <div className="footer-title">{title}</div>
      {links.map((link) => (
        <Link
          key={`${title}-${link.label}`}
          href={link.href}
          onClick={(event) => handleLink(event, link.href)}
          className="footer-link"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function CartDrawer({ navigate, authUser }) {
  const { cart, cartCount, subtotal, cartOpen, closeCart, changeQty, removeItem } = useCart();
  const toFree = itemsToFreeShipping(cartCount);

  if (!cartOpen) return null;

  // The bag is intentionally bag-only now — the full contact / shipping /
  // billing / payment / promo flow lives on the dedicated /checkout page. That
  // page auth-gates itself (Cart → Checkout → Login → back to Checkout) and the
  // cart persists across the round trip (see CartProvider localStorage).
  function goToCheckout() {
    closeCart();
    navigate("/checkout");
  }

  return (
    <div className="cart-layer">
      <button type="button" className="overlay" onClick={closeCart} aria-label="Close cart" />
      <aside className="cart-drawer" aria-label="Shopping bag">
        <div className="cart-head">
          <div className="cart-title">
            <strong>Your Bag</strong>
            <span>({cartCount})</span>
          </div>
          <button type="button" className="icon-button" onClick={closeCart} aria-label="Close cart">
            <Close />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <Bag size={44} />
            <div className="cart-empty__title">Your bag is empty.</div>
            <p>Browse the shop or build a custom piece in the studio.</p>
            <button
              type="button"
              className="button button--dark"
              onClick={() => {
                closeCart();
                navigate("/shop");
              }}
            >
              Browse the shop
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.key} className="cart-item">
                  <div className="cart-item__thumb">
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <TeeGraphic path={item.shape} width={28} fill="#11100E" opacity={0.7} />
                    )}
                  </div>
                  <div className="cart-item__body">
                    <div className="cart-item__top">
                      <div className="cart-item__name">{item.name}</div>
                      <button
                        type="button"
                        className="plain-icon"
                        onClick={() => removeItem(item.key)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Close size={14} />
                      </button>
                    </div>
                    <div className="cart-item__meta">{item.meta}</div>
                    <div className="cart-item__controls">
                      <div className="qty">
                        <button type="button" onClick={() => changeQty(item.key, -1)} aria-label="Decrease quantity">-</button>
                        <span>{item.qty}</span>
                        <button type="button" onClick={() => changeQty(item.key, 1)} aria-label="Increase quantity">+</button>
                      </div>
                      <div className="cart-item__line">{formatPrice(item.price * item.qty)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div className="subtotal">
                <span>Subtotal</span>
                <span>{subtotal}</span>
              </div>
              <div className={`ship-hint ${toFree === 0 ? "ship-hint--unlocked" : ""}`}>
                {toFree === 0
                  ? "Free shipping unlocked"
                  : `Add ${toFree} more item${toFree !== 1 ? "s" : ""} for free shipping`}
              </div>
              <button
                type="button"
                className="button button--dark"
                style={{ width: "100%" }}
                onClick={goToCheckout}
              >
                Checkout
              </button>
              {!authUser && (
                <div className="demo-note">
                  You'll sign in at checkout to place your order.
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
