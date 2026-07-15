"use client";

import React, { useState } from "react";
import { Shield, Scale, AlertTriangle, UserCheck, FileText, Info } from "lucide-react";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("agreement");

  const sections = [
    { id: "agreement", label: "1. Agreement to Terms", icon: <UserCheck className="w-4 h-4" /> },
    { id: "conduct", label: "2. Platform Conduct", icon: <Shield className="w-4 h-4" /> },
    { id: "intellectual", label: "3. Intellectual Property", icon: <FileText className="w-4 h-4" /> },
    { id: "liability", label: "4. Limitation of Liability", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "suspension", label: "5. Account Suspension", icon: <Scale className="w-4 h-4" /> },
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
            <h1 style={{ fontSize: "3.5rem", fontWeight: 700, color: "var(--brand-black)", marginTop: "0.5rem", fontFamily: "'Host Grotesk', sans-serif" }}>Terms & Conditions</h1>
            <p className="text-color-tertiary" style={{ marginTop: "1rem", fontSize: "0.9375rem" }}>
              Last updated: June 2026 • Governing service guidelines for the Nigerian Navy Mentorship Platform.
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
                
                <div id="agreement" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    1. Agreement to Terms
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    By accessing or using the Nigerian Navy Mentorship Platform, you agree to comply with and be bound by these Terms and Conditions. Access to this platform is strictly restricted to active, retired, or auxiliary personnel of the Nigerian Navy who possess valid service numbers and credentials. If you do not agree to these terms, you are not authorized to use the platform.
                  </p>
                </div>

                <div id="conduct" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    2. Platform Conduct & Operational Security
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    Users must maintain the highest standards of professional conduct. Sharing classified military operations information, tactical plans, or security details on the platform is strictly prohibited. Sharing of credentials, impersonation of other officers, or unauthorized access to administrator tools will result in immediate termination of access and military disciplinary procedures.
                  </p>
                </div>

                <div id="intellectual" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    3. Intellectual Property & Training Materials
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    All courseware, training modules, lecture videos, and sea operation manuals shared on the platform are the exclusive intellectual property of the Nigerian Navy. Users are granted a limited, personal, non-transferable license to access these materials for personal development. Copying, exporting, or distributing training documents outside the platform is forbidden.
                  </p>
                </div>

                <div id="liability" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    4. Limitation of Liability
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    Mentorship advice, career guidance, and operational discussions represent the individual opinions of the mentors and do not officially represent the commands or policy positions of the Nigerian Navy Headquarters. The platform is provided "as is" without warranty of any kind.
                  </p>
                </div>

                <div id="suspension" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    5. Account Suspension & Termination
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    We reserve the right to temporarily suspend or permanently delete any user account that violates operational security, acts unprofessionally, or remains inactive for more than 180 days. Users can request account deletion at any time by contacting platform administration.
                  </p>
                </div>

                <div id="contact" style={{ scrollMarginTop: "120px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "4px solid var(--brand-yellow)", paddingLeft: "1.25rem", marginBottom: "1rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    6. Contact Information
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    For any questions regarding these Terms & Conditions or platform policies, please contact the platform administration team at mentorship@navy.mil.ng or through the Contact page.
                  </p>
                </div>

              </div>
            </div>

            {/* Mobile Fallback */}
            <div className="show-mobile-landscape-flex" style={{ display: "none", flexDirection: "column", gap: "2.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    1. Agreement to Terms
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    By accessing or using the Nigerian Navy Mentorship Platform, you agree to comply with and be bound by these Terms and Conditions. Access to this platform is strictly restricted to active, retired, or auxiliary personnel of the Nigerian Navy who possess valid service numbers and credentials. If you do not agree to these terms, you are not authorized to use the platform.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    2. Platform Conduct & Operational Security
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    Users must maintain the highest standards of professional conduct. Sharing classified military operations information, tactical plans, or security details on the platform is strictly prohibited. Sharing of credentials, impersonation of other officers, or unauthorized access to administrator tools will result in immediate termination of access and military disciplinary procedures.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    3. Intellectual Property & Training Materials
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    All courseware, training modules, lecture videos, and sea operation manuals shared on the platform are the exclusive intellectual property of the Nigerian Navy. Users are granted a limited, personal, non-transferable license to access these materials for personal development. Copying, exporting, or distributing training documents outside the platform is forbidden.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    4. Limitation of Liability
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    Mentorship advice, career guidance, and operational discussions represent the individual opinions of the mentors and do not officially represent the commands or policy positions of the Nigerian Navy Headquarters. The platform is provided "as is" without warranty of any kind.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    5. Account Suspension & Termination
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    We reserve the right to temporarily suspend or permanently delete any user account that violates operational security, acts unprofessionally, or remains inactive for more than 180 days. Users can request account deletion at any time by contacting platform administration.
                  </p>
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--brand-black)", borderLeft: "3px solid var(--brand-yellow)", paddingLeft: "1rem", marginBottom: "0.75rem", fontFamily: "'Host Grotesk', sans-serif" }}>
                    6. Contact Information
                  </h2>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    If you have any questions regarding these Terms & Conditions or platform policies, please contact the platform administration team at mentorship@navy.mil.ng or through the Contact page.
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
