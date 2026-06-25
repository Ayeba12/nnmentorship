"use client";

import React from "react";

export default function CookiePolicyPage() {
  return (
    <>
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "2rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Cookie Policy</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view">Cookie Policy</h1>
            <div className="spacer-medium" />
            <p className="text-color-tertiary scroll-into-view" style={{ maxWidth: "36rem" }}>
              Last updated: June 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-card" style={{ padding: "4rem 0" }}>
        <div className="padding-global padding-section-bottom">
          <div className="container-large">
            <div style={{ maxWidth: "48rem" }}>
              <div className="scroll-into-view" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>What Are Cookies?</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
                    Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences, login status, and browsing behavior to improve your experience.
                  </p>
                </div>

                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>Cookies We Use</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: "var(--bg-secondary)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                      <div className="text-xl" style={{ marginBottom: "0.5rem" }}>Essential Cookies</div>
                      <p className="text-color-tertiary">
                        Required for the platform to function. These include authentication tokens and session identifiers. They cannot be disabled.
                      </p>
                    </div>
                    <div style={{ background: "var(--bg-secondary)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                      <div className="text-xl" style={{ marginBottom: "0.5rem" }}>Preference Cookies</div>
                      <p className="text-color-tertiary">
                        Store your settings and preferences, such as language, cookie consent status, and display options.
                      </p>
                    </div>
                    <div style={{ background: "var(--bg-secondary)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                      <div className="text-xl" style={{ marginBottom: "0.5rem" }}>Analytics Cookies</div>
                      <p className="text-color-tertiary">
                        Help us understand how visitors interact with the platform by collecting anonymous usage data. This data is used to improve our services.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>Managing Cookies</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
                    You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, blocking essential cookies may prevent you from using certain features of the platform.
                  </p>
                </div>

                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>Contact</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
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
