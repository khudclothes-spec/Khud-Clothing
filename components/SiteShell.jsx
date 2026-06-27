"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CartProvider, useCart } from "@/components/CartContext";
import { ArrowRight, Bag, Close, Menu } from "@/components/Icons";
import { TeeGraphic } from "@/components/TeeGraphic";
import { navLinks, formatPrice } from "@/lib/data";

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
            </div>
            <div className="mobile-menu__foot">
              <img src={blackLogo} alt="" className="logo" style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>
      ) : null}

      {children}

      <Footer handleLink={handleLink} />
      <CartDrawer navigate={navigate} />
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

function CartDrawer({ navigate }) {
  const { cart, cartCount, subtotal, cartOpen, closeCart, changeQty, removeItem } = useCart();

  if (!cartOpen) return null;

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
                    <TeeGraphic path={item.shape} width={28} fill="#11100E" opacity={0.7} />
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
                        <button type="button" onClick={() => changeQty(item.key, -1)} aria-label="Decrease quantity">
                          -
                        </button>
                        <span>{item.qty}</span>
                        <button type="button" onClick={() => changeQty(item.key, 1)} aria-label="Increase quantity">
                          +
                        </button>
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
              <div className="checkout-note">Shipping and taxes calculated at checkout.</div>
              <button type="button" className="button button--dark" style={{ width: "100%" }}>
                Checkout
              </button>
              <div className="demo-note">Frontend demo, checkout is not connected.</div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
