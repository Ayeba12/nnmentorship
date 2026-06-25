"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("nn_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("nn_theme", newTheme);
    
    // Update document classes
    document.documentElement.className = newTheme + " h-full antialiased";
    document.documentElement.style.colorScheme = newTheme;
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2 border border-hairline text-ink-muted hover:text-ink cursor-pointer transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
      ) : (
        <Moon className="w-4 h-4 text-primary" />
      )}
    </button>
  );
}
