"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@/components/ui';
import { ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react';
import supabase from '@/lib/supabase';

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated (Supabase sets session from the hash fragment automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Recovery session expired or invalid. Please request a new recovery link.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
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
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
            Secure Reset
          </h2>
          <p className="text-navy-300 text-sm mt-4 leading-relaxed">
            Please choose a secure, strong password to regain access to your credentials and active naval mentorship files.
          </p>
        </div>

        <p className="relative z-10 text-navy-400 text-xs">© 2026 Nigerian Navy. All rights reserved.</p>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 bg-white border border-green-100 rounded-2xl shadow-xl"
            >
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-500 mx-auto mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-800">Password Updated</h3>
              <p className="text-xs text-navy-400 mt-2 leading-relaxed">
                Your password has been successfully reset. Redirecting you to the login screen...
              </p>
            </motion.div>
          ) : (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-navy-800 tracking-tight">Set New Password</h1>
                <p className="text-xs text-navy-400 mt-1">Please enter your new login credentials below.</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 font-medium"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8.5 text-navy-400 hover:text-navy-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2 mt-6"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : (
                    <>
                      Update Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-navy-50">Loading session...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
