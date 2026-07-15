"use client";

import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { Loader2, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- Button ----------
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gold' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: 'bg-navy-500 text-white hover:bg-navy-600 shadow-soft hover:shadow-card active:scale-[0.98]',
    secondary: 'bg-navy-100 text-navy-700 hover:bg-navy-200 active:scale-[0.98]',
    outline: 'border border-navy-200 text-navy-700 hover:bg-navy-50 hover:border-navy-300 bg-white active:scale-[0.98]',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-soft active:scale-[0.98]',
    ghost: 'text-navy-600 hover:bg-navy-100 active:scale-[0.98]',
    gold: 'bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 hover:from-gold-400 hover:to-gold-300 shadow-soft hover:shadow-glow active:scale-[0.98] font-semibold',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-soft active:scale-[0.98]',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// ---------- Card ----------
export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={`bg-white rounded-lg border border-navy-100/80 shadow-soft ${hover ? 'card-lift hover:shadow-card hover:border-navy-200' : ''} ${className}`}>{children}</div>;
}

// ---------- Input ----------
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export function Input({ label, error, hint, className = '', type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-navy-700 mb-1.5">
          {label}
          {props.required && <span className="text-gold-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full px-3.5 py-2.5 rounded-md border bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all ${isPassword ? 'pr-10' : ''} ${error ? 'border-red-400' : 'border-navy-200'} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-navy-400 hover:text-navy-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {hint && !error && <p className="mt-1 text-xs text-navy-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

// ---------- Textarea ----------
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-navy-700 mb-1.5">
          {label}
          {props.required && <span className="text-gold-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        className={`w-full px-3.5 py-2.5 rounded-md border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all ${className}`}
        {...props}
      />
    </div>
  );
}

// ---------- Select ----------
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}
export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-navy-700 mb-1.5">
          {label}
          {props.required && <span className="text-gold-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`w-full px-3.5 py-2.5 rounded-md border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ---------- Badge ----------
export function Badge({ children, variant = 'default', dot = false, className = '' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'; dot?: boolean; className?: string }) {
  const variants: Record<string, string> = {
    default: 'bg-navy-100 text-navy-600',
    success: 'bg-green-50 text-green-600 ring-1 ring-green-200/60',
    warning: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/60',
    danger: 'bg-red-50 text-red-600 ring-1 ring-red-200/60',
    info: 'bg-ocean-50 text-ocean-600 ring-1 ring-ocean-200/60',
    gold: 'bg-gold-50 text-gold-600 ring-1 ring-gold-200/60',
  };
  const dotColors: Record<string, string> = {
    default: 'bg-navy-400',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-ocean-500',
    gold: 'bg-gold-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

// ---------- Spinner ----------
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return <Loader2 className={`${sizes[size]} animate-spin text-navy-400`} />;
}

// ---------- Skeleton ----------
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

// ---------- EmptyState ----------
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
      {icon && (
        <div className="mb-4 w-16 h-16 rounded-lg bg-navy-50 flex items-center justify-center text-navy-300">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-navy-700">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-navy-400 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- ProgressBar ----------
export function ProgressBar({ value, max = 100, className = '', color = 'gold' }: { value: number; max?: number; className?: string; color?: 'gold' | 'navy' | 'green' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = { gold: 'bg-gradient-to-r from-gold-500 to-gold-400', navy: 'bg-gradient-to-r from-navy-600 to-navy-500', green: 'bg-gradient-to-r from-green-500 to-green-400' };
  return (
    <div className={`w-full bg-navy-100 rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        className={`${colors[color]} h-2 rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={`relative bg-white rounded-lg shadow-lifted w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="text-lg font-bold text-navy-800">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ---------- Avatar ----------
export function Avatar({ name, src, size = 'md' }: { name?: string | null; src?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes: Record<string, string> = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const safeName = name || 'User';
  const initials = safeName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  if (src) return <img src={src} alt={safeName} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow-soft`} />;
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-white flex items-center justify-center font-semibold flex-shrink-0 ring-2 ring-white shadow-soft`}>
      {initials}
    </div>
  );
}

// ---------- StatCard ----------
export function StatCard({ label, value, icon, color = 'navy', trend }: { label: string; value: string | number; icon?: ReactNode; color?: 'navy' | 'gold' | 'green' | 'red' | 'ocean'; trend?: string }) {
  const colors: Record<string, string> = {
    navy: 'from-navy-600 to-navy-700 text-white',
    gold: 'from-gold-500 to-gold-600 text-white',
    green: 'from-green-500 to-green-600 text-white',
    red: 'from-red-500 to-red-600 text-white',
    ocean: 'from-ocean-500 to-ocean-600 text-white',
  };
  return (
    <Card hover className="p-5 overflow-hidden relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-navy-800 tracking-tight">{value}</p>
          <p className="text-xs text-navy-400 font-medium mt-1">{label}</p>
          {trend && <p className="text-[11px] text-green-500 font-medium mt-1.5 flex items-center gap-1">{trend}</p>}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-md bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-soft`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ---------- RoleBadge ----------
export function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = {
    mentee: 'Mentee',
    active_mentor: 'Active Mentor',
    retired_mentor: 'Retired Mentor',
    admin: 'Administrator',
  };
  const variants: Record<string, 'default' | 'success' | 'warning' | 'info' | 'gold' | 'danger'> = {
    mentee: 'info',
    active_mentor: 'success',
    retired_mentor: 'gold',
    admin: 'danger',
  };
  return <Badge variant={variants[role] || 'default'} dot>{labels[role] || role}</Badge>;
}

// ---------- VerificationBadge ----------
export function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') return <Badge variant="success" dot>Verified</Badge>;
  if (status === 'pending') return <Badge variant="warning" dot>Pending Verification</Badge>;
  if (status === 'rejected') return <Badge variant="danger" dot>Rejected</Badge>;
  return null;
}

// ---------- PageHeader ----------
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-navy-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------- SectionTitle ----------
export function SectionTitle({ children, icon, action }: { children: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <div className="text-navy-400">{icon}</div>}
        <h2 className="font-bold text-navy-800">{children}</h2>
      </div>
      {action}
    </div>
  );
}

// ---------- Pagination ----------
export function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between border-t border-navy-100/50 px-4 py-3 sm:px-6 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-navy-400">
            Showing Page <span className="font-semibold text-navy-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-navy-800">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="relative inline-flex items-center rounded-l-md px-2.5 py-1.5 text-navy-400 ring-1 ring-inset ring-navy-200/50 hover:bg-navy-50 focus:z-20 focus:outline-offset-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
            >
              Previous
            </button>
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-navy-200/50 focus:z-20 focus:outline-offset-0 transition-all ${
                  p === currentPage
                    ? 'z-10 bg-navy-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
                    : 'text-navy-700 hover:bg-navy-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="relative inline-flex items-center rounded-r-md px-2.5 py-1.5 text-navy-400 ring-1 ring-inset ring-navy-200/50 hover:bg-navy-50 focus:z-20 focus:outline-offset-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
