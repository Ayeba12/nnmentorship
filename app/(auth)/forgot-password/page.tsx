"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import supabase from '../../../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/profile`,
      });
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-navy-50">
      {/* Left Panel — Branding */}
      <div 
        className="hidden lg:flex lg:w-2/5 relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{
          backgroundImage: "url('/assets/login-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-navy-950/80 z-0" />
        
        <div className="absolute top-0 right-0 w-72 h-72 bg-navy-600/40 rounded-full blur-3xl z-0" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gold-500/5 rounded-full blur-3xl z-0" />

        <div className="relative z-10 flex items-center gap-2.5">
          <img
            src="/assets/nigerian-navy-logo.png"
            alt="Nigerian Navy Logo"
            className="w-9 h-9 object-contain"
          />
          <div>
            <div className="text-white font-bold text-sm tracking-tight">Nigerian Navy</div>
            <p className="text-navy-300 text-[11px]">Mentorship Platform</p>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-bold text-white leading-tight tracking-tight"
          >
            Account Recovery
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-navy-300 text-sm mt-4 leading-relaxed"
          >
            Preserving security and fleet readiness. Follow the steps to securely recover your account access.
          </motion.p>
        </div>

        <p className="relative z-10 text-navy-400 text-xs">© 2026 Nigerian Navy. All rights reserved.</p>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img
              src="/assets/nigerian-navy-logo.png"
              alt="Nigerian Navy Logo"
              className="w-9 h-9 object-contain"
            />
            <div>
              <div className="text-navy-800 font-bold text-sm tracking-tight">Nigerian Navy</div>
              <p className="text-navy-400 text-[11px]">Mentorship Platform</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="request-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-xl font-bold text-navy-800 tracking-tight">Reset password</h1>
                <p className="text-sm text-navy-400 mt-1">Enter your email and we'll send reset instructions.</p>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-navy-600 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-md border border-navy-200 bg-white text-navy-900 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-400 focus:border-navy-400 transition-all"
                      placeholder="you@navy.mil.ng"
                    />
                  </div>
                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Send Instructions
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-800 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to login
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-100">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-navy-800 tracking-tight">Check your email</h1>
                <p className="text-sm text-navy-400 mt-2 leading-relaxed">
                  We've sent recovery instructions to <strong className="text-navy-700 font-semibold">{email}</strong>. Please check your inbox.
                </p>

                <div className="mt-8">
                  <Link href="/login">
                    <Button className="w-full" size="lg">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
