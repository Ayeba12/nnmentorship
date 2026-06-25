"use client";

import React from "react";

export default function PrivacyPage() {
  return (
    <>
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "2rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Privacy Policy</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view">Privacy Policy</h1>
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
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>1. Information We Collect</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
                    The Nigerian Navy Mentorship Platform collects personal information that you voluntarily provide when registering on the platform, including your full name, service number, rank, specialization branch, email address, and any additional profile information you choose to share. We also automatically collect device and usage data such as IP address, browser type, and pages visited to improve our services.
                  </p>
                </div>

                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>2. How We Use Your Information</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
                    Your information is used to facilitate mentorship matching, manage your account, deliver training courses, and communicate important platform updates. We may use aggregated, anonymized data for analytics and program improvement. Your data is never sold to third parties.
                  </p>
                </div>

                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>3. Data Security</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest. Access to personal information is restricted to authorized personnel only.
                  </p>
                </div>

                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>4. Data Retention</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
                    We retain your personal data for as long as your account is active or as needed to provide you services. Upon request, we will delete your account and associated data within 30 days, unless retention is required by law or for legitimate operational purposes.
                  </p>
                </div>

                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>5. Your Rights</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
                    You have the right to access, correct, or delete your personal information at any time through your account settings. You may also request a copy of your data or ask us to restrict processing. For any privacy-related inquiries, please contact the platform administrator.
                  </p>
                </div>

                <div>
                  <h3 className="heading-style-h4" style={{ marginBottom: "0.75rem" }}>6. Contact Us</h3>
                  <p className="text-color-tertiary" style={{ lineHeight: 1.8 }}>
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
