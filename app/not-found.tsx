"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#010102] text-[#f7f8f8] flex flex-col items-center justify-center p-6 text-center font-sans">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[200px] bg-[#0B3D5C]/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col items-center gap-6 max-w-sm z-10">
        <div className="w-16 h-16 rounded-2xl bg-[#0f1011] border border-[#23252a] flex items-center justify-center shadow-lg overflow-hidden animate-pulse">
          <img
            src="/assets/nigerian-navy-logo.png"
            alt="Nigerian Navy Logo"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold tracking-[2px] text-[#0B3D5C] font-mono">ERROR 404</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
            Route Off Course
          </h1>
          <p className="text-xs text-[#8a8f98] leading-relaxed mt-2">
            The requested tactical link or command page does not exist. It may have been relocated or restricted to cleared officers.
          </p>
        </div>

        {/* Back Button */}
        <Link
          href="/"
          className="mt-2 w-full sm:w-auto bg-[#0B3D5C] hover:bg-[#145C8A] text-white text-xs font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Harbor (Home)
        </Link>
      </div>
    </div>
  );
}
