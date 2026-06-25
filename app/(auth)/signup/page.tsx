"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../../../lib/supabase';
import { api } from '../../../lib/api';
import { Button, Input, Select, Textarea } from '../../../components/ui';
import { ChevronRight, ChevronLeft, ArrowRight, User, Briefcase, GraduationCap, Check } from 'lucide-react';

const branches = ['Engineering', 'Logistics', 'Navigation', 'Operations', 'Communications', 'Medical', 'Administration', 'Intelligence', 'Seamanship', 'Information Technology'];
const ranks = ['Cadet', 'Midshipman', 'Sub Lieutenant', 'Lieutenant', 'Lieutenant Commander', 'Commander', 'Captain', 'Commodore', 'Rear Admiral', 'Vice Admiral', 'Admiral', 'Ordinary Seaman', 'Leading Rating', 'Petty Officer', 'Warrant Officer'];

const roleOptions = [
  { value: 'mentee', label: 'Mentee', desc: 'Cadet, Rating, Junior Officer', icon: GraduationCap },
  { value: 'active_mentor', label: 'Active Mentor', desc: 'Serving Senior Officer', icon: User },
  { value: 'retired_mentor', label: 'Retired Mentor', desc: 'Veteran', icon: Briefcase },
];

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '',
    role: 'mentee' as string,
    full_name: '', service_number: '', service_branch: '', specialization: '',
    rank: '', years_of_service: '', command_location: '', career_goals: '',
    mentorship_interests: '', bio: '',
    last_rank_held: '', years_served: '', years_since_retirement: '',
    civilian_role: '', civilian_industry: '',
    is_accepting_mentees: true, max_mentees: '5',
  });

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authError) throw authError;
      if (!authData.session && !authData.user) throw new Error('Signup failed — please try again');

      await api.profiles.create({
        full_name: form.full_name,
        role: form.role as any,
        service_number: form.service_number || null,
        service_branch: form.service_branch,
        specialization: form.specialization,
        rank: form.rank,
        years_of_service: parseInt(form.years_of_service) || 0,
        command_location: form.command_location,
        career_goals: form.career_goals,
        mentorship_interests: form.mentorship_interests,
        bio: form.bio,
        last_rank_held: form.role === 'retired_mentor' ? form.last_rank_held : null,
        years_served: form.role === 'retired_mentor' ? parseInt(form.years_served) || null : null,
        years_since_retirement: form.role === 'retired_mentor' ? parseInt(form.years_since_retirement) || null : null,
        civilian_role: form.role === 'retired_mentor' ? form.civilian_role : null,
        civilian_industry: form.role === 'retired_mentor' ? form.civilian_industry : null,
        is_accepting_mentees: form.role !== 'mentee' ? form.is_accepting_mentees : undefined,
        max_mentees: form.role !== 'mentee' ? parseInt(form.max_mentees) || 5 : undefined,
      });

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const isMentor = form.role === 'active_mentor' || form.role === 'retired_mentor';

  return (
    <div className="min-h-screen bg-navy-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity mb-3">
            <img
              src="/assets/nigerian-navy-logo.png"
              alt="Nigerian Navy Logo"
              className="w-12 h-12 object-contain mx-auto"
            />
          </Link>
          <h1 className="text-xl font-bold text-navy-800 tracking-tight">Create Your Account</h1>
          <p className="text-sm text-navy-400 mt-1">Join the Nigerian Navy Mentorship Platform</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${s === step ? 'opacity-100' : s < step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all ${s < step ? 'bg-green-500 text-white' : s === step ? 'bg-navy-700 text-white' : 'bg-navy-100 text-navy-400'}`}>
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                <span className={`text-sm font-medium ${s === step ? 'text-navy-800' : 'text-navy-400'}`}>
                  {s === 1 ? 'Account' : 'Service Details'}
                </span>
              </div>
              {s < 2 && <div className={`w-6 h-px ${s < step ? 'bg-green-500' : 'bg-navy-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6 border border-navy-100">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-base font-semibold text-navy-800">Account & Role</h2>

                {/* Role selection */}
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-2">I am registering as</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('role', opt.value)}
                        className={`p-3 rounded-md border text-center transition-all ${form.role === opt.value ? 'border-navy-400 bg-navy-50' : 'border-navy-100 hover:border-navy-200 bg-white'}`}
                      >
                        <opt.icon className={`w-4 h-4 mx-auto mb-1.5 ${form.role === opt.value ? 'text-navy-600' : 'text-navy-400'}`} />
                        <p className={`text-xs font-medium ${form.role === opt.value ? 'text-navy-700' : 'text-navy-500'}`}>{opt.label}</p>
                        <p className="text-[10px] text-navy-400 mt-0.5 leading-tight">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Input label="Full Name" required value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="John Doe" />
                <Input label="Email Address" type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@navy.mil.ng" />
                <Input label="Password" type="password" required value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 6 characters" hint="Choose a strong password with at least 6 characters" />

                <div className="flex justify-end pt-1">
                  <Button onClick={() => setStep(2)} disabled={!form.email || !form.password || !form.full_name}>
                    Continue <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-base font-semibold text-navy-800">Service Details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Service Number" value={form.service_number} onChange={e => update('service_number', e.target.value)} placeholder="NN/12345" />
                    <Select label="Service Branch" value={form.service_branch} onChange={e => update('service_branch', e.target.value)}>
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </Select>
                    <Select label="Rank" value={form.rank} onChange={e => update('rank', e.target.value)}>
                      <option value="">Select rank</option>
                      {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                    <Input label="Years of Service" type="number" value={form.years_of_service} onChange={e => update('years_of_service', e.target.value)} placeholder="5" />
                  </div>
                  <Input label="Specialization" value={form.specialization} onChange={e => update('specialization', e.target.value)} placeholder="e.g. Marine Engineering" />
                  <Input label="Command / Location" value={form.command_location} onChange={e => update('command_location', e.target.value)} placeholder="e.g. Lagos Command" />
                  <Textarea label="Career Goals" rows={2} value={form.career_goals} onChange={e => update('career_goals', e.target.value)} placeholder="What do you want to achieve?" />
                  <Textarea label="Mentorship Interests" rows={2} value={form.mentorship_interests} onChange={e => update('mentorship_interests', e.target.value)} placeholder="Areas you want mentorship in" />
                  <Textarea label="Bio" rows={3} value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Brief introduction about yourself" />

                  {form.role === 'retired_mentor' && (
                    <div className="border-t border-navy-100 pt-4 space-y-4">
                      <h3 className="text-xs font-semibold text-gold-600 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Retirement Details</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input label="Last Rank Held" value={form.last_rank_held} onChange={e => update('last_rank_held', e.target.value)} placeholder="e.g. Commander" />
                        <Input label="Years Served" type="number" value={form.years_served} onChange={e => update('years_served', e.target.value)} placeholder="25" />
                        <Input label="Years Since Retirement" type="number" value={form.years_since_retirement} onChange={e => update('years_since_retirement', e.target.value)} placeholder="3" />
                        <Input label="Current Civilian Role" value={form.civilian_role} onChange={e => update('civilian_role', e.target.value)} placeholder="e.g. Project Manager" />
                      </div>
                      <Input label="Civilian Industry" value={form.civilian_industry} onChange={e => update('civilian_industry', e.target.value)} placeholder="e.g. Oil & Gas" />
                    </div>
                  )}

                  {isMentor && (
                    <label className="flex items-center gap-3 p-3 rounded-md bg-navy-50 border border-navy-100 cursor-pointer hover:bg-navy-100/50 transition-colors">
                      <input type="checkbox" id="accepting" checked={form.is_accepting_mentees} onChange={e => update('is_accepting_mentees', e.target.checked)} className="w-4 h-4 rounded border-navy-200 text-navy-600 focus:ring-navy-400" />
                      <span className="text-sm text-navy-700 font-medium">Accepting new mentees</span>
                    </label>
                  )}

                  <div className="flex justify-between pt-1">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}><ChevronLeft className="w-3.5 h-3.5" /> Back</Button>
                    <Button type="submit" loading={loading}>Create Account <ArrowRight className="w-3.5 h-3.5" /></Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-navy-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-navy-700 font-medium hover:text-navy-900 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
