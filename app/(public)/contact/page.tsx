"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormState({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="main-wrapper">
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Contact</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view" style={{ maxWidth: "60rem" }}>
              Get in Touch
            </h1>
            <div className="spacer-medium" />
            <p className="text-color-tertiary scroll-into-view" style={{ maxWidth: "48rem", fontSize: "1.125rem" }}>
              Need assistance with credential verification, command approvals, or password resets? Send a message to the Directorate of Naval Training support team.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="section-card" style={{ padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="w-layout-grid grid-col-2" style={{ gap: "4rem", alignItems: "start" }}>
              
              {/* Left Column: Contact details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand-gray-800)",
                    flexShrink: 0
                  }}>
                    <MapPin style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Headquarters</h3>
                    <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                      Directorate of Naval Training,<br />
                      Naval Headquarters,<br />
                      Garki, Abuja, Nigeria.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand-gray-800)",
                    flexShrink: 0
                  }}>
                    <Mail style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Email Command Support</h3>
                    <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                      support@navymentorship.mil.ng
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand-gray-800)",
                    flexShrink: 0
                  }}>
                    <Phone style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Helpline</h3>
                    <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                      +234 9 000 000 000 (Mon-Fri, 0800 - 1700 hrs)
                    </p>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid var(--border-primary)", margin: "1rem 0" }} />

                <div style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "0.75rem",
                  padding: "1.5rem"
                }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Important Notice</h4>
                  <p className="text-color-tertiary" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
                    For emergency watchkeeping modifications or active duty command assignments, please refer directly to the official radio room and your command office instead of this web portal.
                  </p>
                </div>
              </div>

              {/* Right Column: Contact Form */}
              <div style={{
                background: "var(--brand-soft-yellow)",
                borderRadius: "1rem",
                padding: "3rem",
                border: "1px solid var(--border-secondary)"
              }}>
                {submitted ? (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1.5rem",
                      color: "var(--brand-gray-800)"
                    }}>
                      <CheckCircle2 style={{ width: 28, height: 28 }} />
                    </div>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Message Sent</h3>
                    <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                      Thank you for contacting us. Our command staff will review your query and respond shortly.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="button is-secondary"
                      style={{ marginTop: "1.5rem" }}
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <label htmlFor="name" style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        required
                        style={{
                          width: "100%",
                          padding: "0.875rem 1.25rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--border-secondary)",
                          fontFamily: "inherit",
                          fontSize: "0.875rem",
                          outline: "none"
                        }}
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        style={{
                          width: "100%",
                          padding: "0.875rem 1.25rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--border-secondary)",
                          fontFamily: "inherit",
                          fontSize: "0.875rem",
                          outline: "none"
                        }}
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formState.subject}
                        onChange={handleChange}
                        required
                        style={{
                          width: "100%",
                          padding: "0.875rem 1.25rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--border-secondary)",
                          fontFamily: "inherit",
                          fontSize: "0.875rem",
                          outline: "none"
                        }}
                        placeholder="Password reset / Credential issue"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formState.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "0.875rem 1.25rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--border-secondary)",
                          fontFamily: "inherit",
                          fontSize: "0.875rem",
                          outline: "none",
                          resize: "vertical"
                        }}
                        placeholder="Describe your request in detail..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="button is-secondary"
                      style={{ width: "100%" }}
                    >
                      {loading ? "Sending..." : "Submit Inquiry"}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
