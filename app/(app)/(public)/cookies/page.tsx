"use client";

import React, { useState } from "react";
import { Eye, Info, Settings, HelpCircle } from "lucide-react";

export default function CookiePolicyPage() {
  const [activeSection, setActiveSection] = useState("about");

  const sections = [
    { id: "about", label: "What Are Cookies?", icon: <HelpCircle className="w-4 h-4" /> },
    { id: "use", label: "Cookies We Use", icon: <Eye className="w-4 h-4" /> },
    { id: "manage", label: "Managing Cookies", icon: <Settings className="w-4 h-4" /> },
    { id: "contact", label: "Contact Us", icon: <Info className="w-4 h-4" /> },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6.5rem", paddingBottom: "3rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)" }}>
        <div className="padding-global">
          <div className="container-large">
            <span className="text_title" style={{ color: "var(--brand-yellow)", fontWeight: 800 }}>Platform Governance</span>
            <h1 style={{ fontSize: "3.5rem", fontWeight: 700, color: "var(--brand-black)", marginTop: "0.5rem", fontFamily: "'Host Grotesk', sans-serif" }}>Cookie Policy</h1>
            <p className="text-color-tertiary" style={{ marginTop: "1rem", fontSize: "0.9375rem" }}>
              Last updated: June 2026 • Specifying cookie storage practices for the Nigerian Navy Mentorship Platform.
            </p>
          </div>
        </div>
      </section>

      {/* Two-Column Layout */}
      <section className="section-card" style={{ background: "var(--brand-white)", padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large">
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "4rem", alignItems: "start" }} className="hide-mobile-landscape-grid">
              
              {/* Left Sticky Sidebar */}
              <aside style={{ position: "sticky", top: "7rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span className="text_title" style={{ fontSize: "0.6875rem", letterSpacing: "0.1em", color: "var(--brand-gray-500)", marginBottom: "0.5rem" }}>Table of Contents</span>
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      background: activeSection === s.id ? "rgba(0, 32, 91, 0.04)" : "transparent",
                      border: "none",
                      borderLeft: activeSection === s.id ? "3px solid var(--brand-yellow)" : "3px solid transparent",
                      color: activeSection === s.id ? "var(--brand-black)" : "var(--brand-gray-500)",
                      padding: "0.75rem 1rem",
                      borderRadius: "0 6px 6px 0",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: activeSection === s.id ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      width: "100%"
                    }}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </aside>

              {/* Right Content */}
              <div style={{ maxWidth: "48rem", display: "flex", flexDirection: "column", gap: "3.5rem" }}>
                
                <div id="about" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    What Are Cookies?
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences, login status, and browsing behavior to improve your experience.
                  </p>
                </div>

                <div id="use" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    Cookies We Use
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
                    
                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                      <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--brand-black)", marginBottom: "0.5rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                        Essential Cookies
                      </h4>
                      <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                        Required for the platform to function. These include authentication tokens, security checks, and session identifiers. They cannot be disabled.
                      </p>
                    </div>

                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                      <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--brand-black)", marginBottom: "0.5rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                        Preference Cookies
                      </h4>
                      <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                        Store your settings and preferences, such as system theme, cookie consent status, and display options.
                      </p>
                    </div>

                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                      <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--brand-black)", marginBottom: "0.5rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                        Analytics Cookies
                      </h4>
                      <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                        Help us understand how visitors interact with the platform by collecting anonymous usage data. This data is used to improve our services.
                      </p>
                    </div>

                  </div>
                </div>

                <div id="manage" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    Managing Cookies
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, blocking essential cookies may prevent you from using certain features of the platform.
                  </p>
                </div>

                <div id="contact" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    Contact
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    For questions about our cookie practices, please reach out at mentorship@navy.mil.ng or visit our Contact page.
                  </p>
                </div>

              </div>
            </div>

            {/* Mobile Fallback */}
            <div className="show-mobile-landscape-flex" style={{ display: "none", flexDirection: "column", gap: "2.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                
                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    What Are Cookies?
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences, login status, and browsing behavior to improve your experience.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    Cookies We Use
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--brand-black)", marginBottom: "0.35rem", fontFamily: "'Host Grotesk', sans-serif" }}>Essential Cookies</h4>
                      <p className="text-color-tertiary" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
                        Required for the platform to function. These include authentication tokens, security checks, and session identifiers. They cannot be disabled.
                      </p>
                    </div>
                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--brand-black)", marginBottom: "0.35rem", fontFamily: "'Host Grotesk', sans-serif" }}>Preference Cookies</h4>
                      <p className="text-color-tertiary" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
                        Store your settings and preferences, such as system theme, cookie consent status, and display options.
                      </p>
                    </div>
                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--brand-black)", marginBottom: "0.35rem", fontFamily: "'Host Grotesk', sans-serif" }}>Analytics Cookies</h4>
                      <p className="text-color-tertiary" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
                        Help us understand how visitors interact with the platform by collecting anonymous usage data. This data is used to improve our services.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    Managing Cookies
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, blocking essential cookies may prevent you from using certain features of the platform.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    Contact
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    For questions about our cookie practices, please reach out at mentorship@navy.mil.ng or visit our Contact page.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
