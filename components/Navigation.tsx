"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Anchor, Book, FileText, LayoutDashboard, LogOut, Menu, X, LogIn } from "lucide-react";
import { useAuth } from "./AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };


  return (
    <header className="fixed top-4 left-4 right-4 max-w-7xl mx-auto z-50 bg-surface-1/80 backdrop-blur-md border border-hairline h-16 rounded-lg px-4 md:px-6 flex items-center justify-between shadow-lg transition-colors">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <img
          src="/assets/nigerian-navy-logo.png"
          alt="Nigerian Navy Logo"
          className="w-9 h-9 object-contain"
        />
        <div className="flex flex-col">
          <span className="text-xs uppercase font-extrabold tracking-[0.6px] text-ink leading-none">Nigerian Navy</span>
          <span className="text-[10px] text-ink-subtle mt-0.5 leading-none font-medium">Mentorship Command</span>
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-6">
        <Link
          href="/"
          className={`text-xs font-semibold tracking-wide transition-colors ${
            pathname === "/" ? "text-primary" : "text-ink-subtle hover:text-ink"
          }`}
        >
          Home
        </Link>
        <Link
          href="/blog"
          className={`text-xs font-semibold tracking-wide transition-colors ${
            pathname === "/blog" ? "text-primary" : "text-ink-subtle hover:text-ink"
          }`}
        >
          Blog
        </Link>
        <Link
          href="/library"
          className={`text-xs font-semibold tracking-wide transition-colors ${
            pathname === "/library" ? "text-primary" : "text-ink-subtle hover:text-ink"
          }`}
        >
          Digital Library
        </Link>
      </nav>

      {/* Action Area (Desktop) */}
      <div className="hidden md:flex items-center gap-3">
        <ThemeToggle />

        {profile ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs px-3.5 py-2 rounded-md font-semibold cursor-pointer transition-all border border-primary/20 shadow-md"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink text-xs px-3 py-2 rounded-md font-semibold cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only">Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs px-4 py-2 rounded-md font-semibold cursor-pointer transition-all border border-primary/20 shadow-md"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-surface-2 border border-hairline text-ink-muted hover:text-ink cursor-pointer focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 bg-surface-1 border border-hairline p-5 rounded-lg shadow-xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-sm font-semibold p-2 rounded ${
              pathname === "/" ? "bg-primary/10 text-primary" : "text-ink-muted hover:bg-surface-2"
            }`}
          >
            <Anchor className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-sm font-semibold p-2 rounded ${
              pathname === "/blog" ? "bg-primary/10 text-primary" : "text-ink-muted hover:bg-surface-2"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Blog</span>
          </Link>
          <Link
            href="/library"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-sm font-semibold p-2 rounded ${
              pathname === "/library" ? "bg-primary/10 text-primary" : "text-ink-muted hover:bg-surface-2"
            }`}
          >
            <Book className="w-4 h-4" />
            <span>Digital Library</span>
          </Link>

          <hr className="border-hairline" />

          {profile ? (
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm py-2.5 rounded font-semibold cursor-pointer transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center justify-center gap-1.5 bg-surface-2 hover:bg-surface-3 text-ink-muted hover:text-ink text-sm py-2.5 rounded font-semibold cursor-pointer border border-hairline"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm py-2.5 rounded font-semibold cursor-pointer transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      )}

    </header>
  );
}
