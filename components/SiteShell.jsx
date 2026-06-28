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
  const revealObserver = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [phase, setPhase] = useState("");
  const { cartCount, openCart } = useCart();
  const [authUser, setAuthUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState("");
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
    setPhase("is-covering");
    timers.current = [
      setTimeout(() => router.push(href), 430),
      setTimeout(() => setPhase("is-revealing"), 520),
      setTimeout(() => setPhase(""), 1020)
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
      </div>

      <div className="announcement" aria-label="Announcements">
        <div className="announcement__track">
          {Array.from({ length: 2 }).map((_, index) => (
            <span key={index} style={{ display: "inline-flex", gap: 52 }}>
              <span>Drop 01 / Summer '26</span>
              <span className="announcement__spark">*</span>
              <span>Free Shipping Over Rs 10,000</span>
              <span className="announcement__spark">*</span>
              <span>Custom Orders Open</span>
              <span className="announcement__spark">*</span>
              <span>Printed and Stitched Locally</span>
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

      <Footer handleLink={handleLink} />
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

function Footer({ handleLink }) {
  const shopLinks = [
    { label: "All pieces", href: "/shop" },
    { label: "Oversized Tees", href: "/shop" },
    { label: "Hoodies", href: "/shop" },
    { label: "Size Guide", href: "/size-guide" }
  ];
  const studioLinks = [
    { label: "Customize", href: "/customize" },
    { label: "About Khud", href: "/about" },
    { label: "Our philosophy", href: "/about" },
    { label: "Quality promise", href: "/about" }
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
            {["Instagram", "TikTok", "Pinterest", "WhatsApp"].map((label) => (
              <span key={label} className="footer-text">
                {label}
              </span>
            ))}
            <div className="footer-text" style={{ marginTop: 10 }}>
              hello@khud.studio
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>(c) 2026 Khud. All rights reserved.</span>
          <span>Karachi - Lahore - Worldwide shipping</span>
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
  const { cart, cartCount, subtotal, cartOpen, closeCart, changeQty, removeItem, placeOrder } = useCart();
  const [step, setStep] = useState("bag"); // "bag" | "checkout" | "done"
  const [shipping, setShipping] = useState({
    full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: ""
  });
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderId, setOrderId] = useState(null);

  // Reset to bag view whenever drawer is opened
  useEffect(() => {
    if (cartOpen) {
      setStep("bag");
      setOrderError("");
    }
  }, [cartOpen]);

  if (!cartOpen) return null;

  async function handleCheckout(e) {
    e.preventDefault();
    setPlacing(true);
    setOrderError("");
    try {
      const result = await placeOrder(shipping);
      setOrderId(result.orderId);
      setStep("done");
    } catch (err) {
      setOrderError(err.message.includes("Not signed in")
        ? "Please sign in before placing an order."
        : err.message);
    } finally {
      setPlacing(false);
    }
  }

  function updateShipping(field, value) {
    setShipping((prev) => ({ ...prev, [field]: value }));
  }

  if (step === "done") {
    return (
      <div className="cart-layer">
        <button type="button" className="overlay" onClick={closeCart} aria-label="Close cart" />
        <aside className="cart-drawer" aria-label="Order confirmation">
          <div className="cart-head">
            <div className="cart-title"><strong>Order Placed</strong></div>
            <button type="button" className="icon-button" onClick={closeCart}><Close /></button>
          </div>
          <div className="cart-empty">
            <div className="cart-empty__title" style={{ color: "var(--olive)" }}>Your order is confirmed.</div>
            <p>We'll process it shortly and reach out via the contact details you provided.</p>
            {orderId && <p style={{ fontSize: 12, color: "var(--charcoal)" }}>Reference: {orderId.slice(0, 8).toUpperCase()}</p>}
            <button type="button" className="button button--dark" onClick={() => { closeCart(); navigate("/shop"); }}>
              Continue Shopping
            </button>
          </div>
        </aside>
      </div>
    );
  }

  if (step === "checkout") {
    return (
      <div className="cart-layer">
        <button type="button" className="overlay" onClick={closeCart} aria-label="Close cart" />
        <aside className="cart-drawer" aria-label="Checkout">
          <div className="cart-head">
            <div className="cart-title">
              <button type="button" className="plain-icon" onClick={() => setStep("bag")} style={{ marginRight: 8 }}>←</button>
              <strong>Shipping Details</strong>
            </div>
            <button type="button" className="icon-button" onClick={closeCart}><Close /></button>
          </div>
          <form onSubmit={handleCheckout} className="checkout-form">
            {orderError && <div className="auth-error" style={{ margin: "0 0 12px" }}>{orderError}{" "}
              {orderError.includes("sign in") && <Link href="/login" onClick={closeCart} style={{ textDecoration: "underline" }}>Sign in</Link>}
            </div>}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" required value={shipping.full_name} onChange={(e) => updateShipping("full_name", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" required value={shipping.phone} onChange={(e) => updateShipping("phone", e.target.value)} placeholder="+92 300 0000000" />
            </div>
            <div className="form-group">
              <label className="form-label">Address *</label>
              <input className="form-input" required value={shipping.address_line1} onChange={(e) => updateShipping("address_line1", e.target.value)} placeholder="Street address" />
            </div>
            <div className="form-group">
              <input className="form-input" value={shipping.address_line2} onChange={(e) => updateShipping("address_line2", e.target.value)} placeholder="Apt / floor (optional)" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-input" required value={shipping.city} onChange={(e) => updateShipping("city", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Province *</label>
                <input className="form-input" required value={shipping.state} onChange={(e) => updateShipping("state", e.target.value)} placeholder="Sindh" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code *</label>
              <input className="form-input" required value={shipping.postal_code} onChange={(e) => updateShipping("postal_code", e.target.value)} />
            </div>
            <div className="cart-summary" style={{ marginTop: "auto", paddingTop: 16 }}>
              <div className="subtotal">
                <span>Total</span>
                <span>{subtotal}</span>
              </div>
              <div className="checkout-note">Cash on delivery · Nationwide shipping</div>
              <button type="submit" className="button button--dark" style={{ width: "100%" }} disabled={placing}>
                {placing ? "Placing order…" : "Place Order (COD)"}
              </button>
            </div>
          </form>
        </aside>
      </div>
    );
  }

  // step === "bag"
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
              <div className="checkout-note">Shipping calculated at checkout.</div>
              <button
                type="button"
                className="button button--dark"
                style={{ width: "100%" }}
                onClick={() => { setOrderError(""); setStep("checkout"); }}
              >
                Checkout
              </button>
              {!authUser && (
                <div className="demo-note">
                  <Link href="/login" onClick={closeCart} style={{ color: "var(--clay)", textDecoration: "underline" }}>
                    Sign in
                  </Link>
                  {" "}required to place an order.
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
