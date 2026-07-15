import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from "@/components/AuthContext";
import { type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Nigerian Navy Mentorship Platform",
  description: "Institutional-grade matching and mentorship coordination platform for Nigerian Navy personnel and administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#f6f8fb] text-[#00153D]" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
