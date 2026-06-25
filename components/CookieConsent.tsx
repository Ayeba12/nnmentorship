"use client";

import React, { useEffect, useState } from "react";
import { X, Shield } from "lucide-react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after a slight delay
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-header">
        <div className="cookie-title-wrap">
          <div className="cookie-icon-badge">
            <Shield style={{ width: 16, height: 16 }} />
          </div>
          <span className="cookie-title">Cookie Consent Policy</span>
        </div>
        <button
          onClick={handleDecline}
          className="cookie-close-btn"
          aria-label="Close cookie consent banner"
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <p className="cookie-description">
        We use cookies to verify military credentials, secure authentication sessions, and compile traffic metrics to improve platform response times. Read our{" "}
        <a href="/privacy">
          Privacy Policy
        </a>{" "}
        for details.
      </p>

      <div className="cookie-buttons">
        <button
          onClick={handleAccept}
          className="cookie-btn-accept"
        >
          Accept Selection
        </button>
        <button
          onClick={handleDecline}
          className="cookie-btn-decline"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
