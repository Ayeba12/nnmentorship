"use client";

import React, { useState } from "react";
import { Shield, Lock, Eye, RefreshCw, CheckCircle, Info } from "lucide-react";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("collect");

  const sections = [
    { id: "collect", label: "1. Information We Collect", icon: <Eye className="w-4 h-4" /> },
    { id: "use", label: "2. How We Use It", icon: <RefreshCw className="w-4 h-4" /> },
    { id: "security", label: "3. Data Security", icon: <Lock className="w-4 h-4" /> },
    { id: "retention", label: "4. Data Retention", icon: <CheckCircle className="w-4 h-4" /> },
    { id: "rights", label: "5. Your Rights", icon: <Shield className="w-4 h-4" /> },
    { id: "contact", label: "6. Contact Information", icon: <Info className="w-4 h-4" /> },
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
            <h1 style={{ fontSize: "3.5rem", fontWeight: 700, color: "var(--brand-black)", marginTop: "0.5rem", fontFamily: "'Host Grotesk', sans-serif" }}>Privacy Policy</h1>
            <p className="text-color-tertiary" style={{ marginTop: "1rem", fontSize: "0.9375rem" }}>
              Last updated: June 2026 • Governing operational privacy standards for the Nigerian Navy Mentorship Platform.
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
                    {s.label.split(". ")[1] || s.label}
                  </button>
                ))}
              </aside>

              {/* Right Content */}
              <div style={{ maxWidth: "48rem", display: "flex", flexDirection: "column", gap: "3.5rem" }}>
                
                <div id="collect" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    1. Information We Collect
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    The Nigerian Navy Mentorship Platform collects personal information that you voluntarily provide when registering on the platform, including your full name, service number, rank, specialization branch, email address, and any additional profile information you choose to share. We also automatically collect device and usage data such as IP address, browser type, and pages visited to improve our services.
                  </p>
                </div>

                <div id="use" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    2. How We Use Your Information
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    Your information is used to facilitate mentorship matching, manage your account, deliver training courses, and communicate important platform updates. We may use aggregated, anonymized data for analytics and program improvement. Your data is never sold to third parties.
                  </p>
                </div>

                <div id="security" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    3. Data Security
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest. Access to personal information is restricted to authorized personnel only.
                  </p>
                </div>

                <div id="retention" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    4. Data Retention
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    We retain your personal data for as long as your account is active or as needed to provide you services. Upon request, we will delete your account and associated data within 30 days, unless retention is required by law or for legitimate operational purposes.
                  </p>
                </div>

                <div id="rights" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    5. Your Rights
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    You have the right to access, correct, or delete your personal information at any time through your account settings. You may also request a copy of your data or ask us to restrict processing. For any privacy-related inquiries, please contact the platform administrator.
                  </p>
                </div>

                <div id="contact" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    6. Contact Us
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    If you have any questions about this Privacy Policy or our data practices, please contact us at mentorship@navy.mil.ng or through the Contact page on our website.
                  </p>
                </div>

              </div>
            </div>

            {/* Mobile Fallback */}
            <div className="show-mobile-landscape-flex" style={{ display: "none", flexDirection: "column", gap: "2.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    1. Information We Collect
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    The Nigerian Navy Mentorship Platform collects personal information that you voluntarily provide when registering on the platform, including your full name, service number, rank, specialization branch, email address, and any additional profile information you choose to share. We also automatically collect device and usage data such as IP address, browser type, and pages visited to improve our services.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    2. How We Use Your Information
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    Your information is used to facilitate mentorship matching, manage your account, deliver training courses, and communicate important platform updates. We may use aggregated, anonymized data for analytics and program improvement. Your data is never sold to third parties.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    3. Data Security
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest. Access to personal information is restricted to authorized personnel only.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    4. Data Retention
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    We retain your personal data for as long as your account is active or as needed to provide you services. Upon request, we will delete your account and associated data within 30 days, unless retention is required by law or for legitimate operational purposes.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    5. Your Rights
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    You have the right to access, correct, or delete your personal information at any time through your account settings. You may also request a copy of your data or ask us to restrict processing. For any privacy-related inquiries, please contact the platform administrator.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    6. Contact Us
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    If you have any questions about this Privacy Policy or our data practices, please contact us at mentorship@navy.mil.ng or through the Contact page on our website.
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
