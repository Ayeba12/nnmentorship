"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Global Error Boundary
 * 
 * Captures unhandled React errors and reports them to Sentry.
 * Displays a user-friendly error message with a retry button.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f8fafc',
          color: '#0c1d3a',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '480px',
            padding: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              marginBottom: '0.75rem',
              color: '#0c1d3a',
            }}>
              Something went wrong
            </h2>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#64748b', 
              marginBottom: '1.5rem',
              lineHeight: '1.6',
            }}>
              An unexpected error occurred. Our team has been notified and is working on a fix.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: '#0c1d3a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1a3a5c')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0c1d3a')}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
