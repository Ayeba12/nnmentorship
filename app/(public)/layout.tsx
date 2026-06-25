"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";
import "./public.css";
import CookieConsent from "@/components/CookieConsent";

/* ─── Scroll-reveal hook ─── */
function useScrollReveal(pathname: string) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    // Wait 100ms for client-side page mounting to complete before querying DOM
    const timer = setTimeout(() => {
      const els = document.querySelectorAll(
        ".public-website .scroll-into-view, .public-website .scroll-into-img"
      );
      els.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useScrollReveal(pathname);

  const handleLinkClick = () => setMobileMenuOpen(false);

  const navLinks = [
    { label: "About", href: "/about" },
    { label: "Courses", href: "/courses" },
    { label: "Directory", href: "/directory" },
    { label: "Blog", href: "/blog" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className="public-website">
      <div className="page-wrapper">
        {/* ── Navbar ── */}
        <nav className="navbar" role="banner">
          <div className="main-wrapper is-nav">
            <div className="padding-global is-navbar">
              <div className="container-large">
                <div className="navbar_content">
                  {/* Logo */}
                  <Link href="/" className="navbar_logo-link">
                    <img
                      src="/assets/nigerian-navy-logo.png"
                      alt="Nigerian Navy Logo"
                      style={{
                        width: 36,
                        height: 36,
                        objectFit: "contain",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          lineHeight: 1.1,
                          fontFamily: "'Host Grotesk', sans-serif",
                        }}
                      >
                        NAVY MENTORSHIP
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--brand-gray-500)",
                          letterSpacing: "0.08em",
                          lineHeight: 1.1,
                         }}
                      >
                        NIGERIAN NAVY HQ
                      </span>
                    </div>
                  </Link>

                  {/* Desktop Nav */}
                  <div className="nav_wrap" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div className="navbar_list" style={{ display: "none" }} id="desktop-nav">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`nav_links${pathname === link.href ? " is-active" : ""}`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Right: CTA + Mobile Burger */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {/* Desktop Auth */}
                    <div className="nav-desktop-auth" style={{ display: "none" }} id="desktop-auth">
                      {user ? (
                        <>
                          <Link href="/dashboard" className="button is-small" style={{ gap: 6 }}>
                            <LayoutDashboard style={{ width: 14, height: 14 }} />
                            Dashboard
                          </Link>
                          <button
                            onClick={() => signOut()}
                            className="button is-outline"
                            style={{
                              padding: "0.625rem 1.25rem",
                              fontSize: "0.8125rem",
                              cursor: "pointer",
                            }}
                          >
                            <LogOut style={{ width: 14, height: 14 }} />
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <Link href="/login" className="button is-small">
                          Login
                        </Link>
                      )}
                    </div>

                    {/* Mobile Burger */}
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className={`nav-mobile-burger ${mobileMenuOpen ? "is-active" : ""}`}
                      aria-label="Toggle navigation menu"
                      style={{
                        display: "none",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        position: "relative",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        width: "24px",
                        height: "16px",
                      }}
                      id="mobile-burger"
                    >
                      <span className="burger-line"></span>
                      <span className="burger-line"></span>
                      <span className="burger-line"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Mobile Nav Overlay ── */}
        <div className={`mobile-nav-overlay ${mobileMenuOpen ? "is-active" : ""}`}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={`nav_links${pathname === link.href ? " is-active" : ""}`}
                style={{
                  fontSize: "1.25rem",
                  padding: "0.875rem 0",
                  borderBottom: "1px solid #efeff2",
                  display: "block",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "1.5rem" }}>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={handleLinkClick}
                  className="button is-small"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <LayoutDashboard style={{ width: 16, height: 16 }} />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    handleLinkClick();
                  }}
                  className="button is-outline"
                  style={{ width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <LogOut style={{ width: 16, height: 16 }} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={handleLinkClick}
                  className="button"
                  style={{ width: "100%", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={handleLinkClick}
                  className="button is-outline"
                  style={{ width: "100%", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="main-wrapper">{children}</div>

        {/* ── Footer ── */}
        <footer className="footer">
          <div className="padding-global padding-section-small">
            <div className="container-large">
              {/* Footer Top */}
              <div className="footer_top">
                <div className="footer-content">
                  <div className="text-max is-29rem scroll-into-view">
                    <div style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
                      Empowering watchkeepers, tactical operators, and
                      transitioning officers of the Nigerian Navy through
                      structured, verified mentorship.
                    </div>
                  </div>
                  <div className="list_social-media scroll-into-view">
                    <a href="#" className="footer_icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 20 20" fill="none" className="icon_social-media">
                        <path d="M13.3333 2.5C14.4384 2.5 15.4982 2.93899 16.2796 3.72039C17.061 4.50179 17.5 5.5616 17.5 6.66667V13.3333C17.5 14.4384 17.061 15.4982 16.2796 16.2796C15.4982 17.061 14.4384 17.5 13.3333 17.5H6.66667C5.5616 17.5 4.50179 17.061 3.72039 16.2796C2.93899 15.4982 2.5 14.4384 2.5 13.3333V6.66667C2.5 5.5616 2.93899 4.50179 3.72039 3.72039C4.50179 2.93899 5.5616 2.5 6.66667 2.5H13.3333ZM10 6.66667C9.11594 6.66667 8.2681 7.01786 7.64298 7.64298C7.01786 8.2681 6.66667 9.11594 6.66667 10C6.66667 10.8841 7.01786 11.7319 7.64298 12.357C8.2681 12.9821 9.11594 13.3333 10 13.3333C10.8841 13.3333 11.7319 12.9821 12.357 12.357C12.9821 11.7319 13.3333 10.8841 13.3333 10C13.3333 9.11594 12.9821 8.2681 12.357 7.64298C11.7319 7.01786 10.8841 6.66667 10 6.66667ZM10 8.33333C10.442 8.33333 10.866 8.50893 11.1785 8.82149C11.4911 9.13405 11.6667 9.55797 11.6667 10C11.6667 10.442 11.4911 10.866 11.1785 11.1785C10.866 11.4911 10.442 11.6667 10 11.6667C9.55797 11.6667 9.13405 11.4911 8.82149 11.1785C8.50893 10.866 8.33333 10.442 8.33333 10C8.33333 9.55797 8.50893 9.13405 8.82149 8.82149C9.13405 8.50893 9.55797 8.33333 10 8.33333Z" fill="currentColor" />
                      </svg>
                    </a>
                    <a href="#" className="footer_icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 20 20" fill="none" className="icon_social-media">
                        <path d="M18.3346 9.9974C18.3346 5.3974 14.6013 1.66406 10.0013 1.66406C5.4013 1.66406 1.66797 5.3974 1.66797 9.9974C1.66797 14.0307 4.53464 17.3891 8.33464 18.1641V12.4974H6.66797V9.9974H8.33464V7.91406C8.33464 6.30573 9.64297 4.9974 11.2513 4.9974H13.3346V7.4974H11.668C11.2096 7.4974 10.8346 7.8724 10.8346 8.33073V9.9974H13.3346V12.4974H10.8346V18.2891C15.043 17.8724 18.3346 14.3224 18.3346 9.9974Z" fill="currentColor" />
                      </svg>
                    </a>
                    <a href="#" className="footer_icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 20 20" fill="none" className="icon_social-media">
                        <path d="M8.7387 12.2092L12.707 17.5H18.5404L11.992 8.76833L17.4404 2.5H15.232L10.9679 7.405L7.29036 2.5H1.45703L7.71536 10.8458L1.93203 17.5H4.14036L8.7387 12.2092ZM13.5404 15.8333L4.79036 4.16667H6.45703L15.207 15.8333H13.5404Z" fill="currentColor" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="footer_column scroll-into-view">
                  <Link href="/" className="footer_link">Home</Link>
                  <Link href="/about" className="footer_link">About</Link>
                  <Link href="/courses" className="footer_link">Courses</Link>
                  <Link href="/directory" className="footer_link">Directory</Link>
                </div>

                <div className="footer_column scroll-into-view">
                  <Link href="/blog" className="footer_link">Blog</Link>
                  <Link href="/gallery" className="footer_link">Gallery</Link>
                  <Link href="/contact" className="footer_link">Contact</Link>
                </div>

                <div className="footer_column scroll-into-view">
                  <Link href="/privacy" className="footer_link">Privacy Policy</Link>
                  <Link href="/cookies" className="footer_link">Cookie Policy</Link>
                  <Link href="/login" className="footer_link">Login</Link>
                </div>
              </div>

              <div className="section-gap-large" />

              {/* Footer Bottom */}
              <div className="footer_bottom">
                <div className="footer_pipely scroll-into-view">
                  <div className="footer_big-text">Navy Mentorship</div>
                </div>
                <div className="footer_bottom_links">
                  <div className="footer_bottom_left">
                    <Link href="/privacy" className="footer_text-link">Privacy Policy</Link>
                    <Link href="/cookies" className="footer_text-link">Cookie Policy</Link>
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-quaternary)" }}>
                    © 2026 Nigerian Navy Headquarters. All rights reserved.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>

        <CookieConsent />
      </div>

      {/* Responsive style injection for desktop/mobile nav visibility */}
      <style>{`
        /* Desktop: show nav links + auth, hide burger */
        @media (min-width: 992px) {
          #desktop-nav { display: flex !important; }
          #desktop-auth { display: flex !important; gap: 0.5rem; align-items: center; }
          #mobile-burger { display: none !important; }
        }
        /* Mobile: hide nav links + auth, show burger */
        @media (max-width: 991px) {
          #desktop-nav { display: none !important; }
          #desktop-auth { display: none !important; }
          #mobile-burger { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
