"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, Button, Select, Avatar, Badge, Spinner, EmptyState, ProgressBar, PageHeader } from '@/components/ui';
import { useAuth } from '@/components/AuthContext';
import type { Profile, MatchedMentor } from '@/lib/types';
import { Search, Sparkles, Filter, ChevronRight } from 'lucide-react';

const branches = ['Engineering', 'Logistics', 'Navigation', 'Operations', 'Communications', 'Medical', 'Administration', 'Intelligence', 'Seamanship', 'Information Technology'];

function tierColor(tier: string) {
  if (tier.includes('Excellent')) return { badge: 'success' as const, color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' };
  if (tier.includes('Good')) return { badge: 'info' as const, color: 'text-ocean-600', bg: 'bg-ocean-50', ring: 'ring-ocean-200' };
  if (tier.includes('Fair')) return { badge: 'warning' as const, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' };
  return { badge: 'default' as const, color: 'text-navy-400', bg: 'bg-navy-50', ring: 'ring-navy-200' };
}

export default function FindMentor() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchedMentor[]>([]);
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'all', specialization: 'all', branch: 'all', q: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'recommended' | 'all'>('recommended');

  const loadMentors = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.specialization !== 'all') params.specialization = filters.specialization;
      if (filters.branch !== 'all') params.branch = filters.branch;
      if (filters.q) params.q = filters.q;
      const [m, matchResults] = await Promise.all([
        api.profiles.mentors(params),
        filters.type === 'all' && !filters.q ? api.matching.detailed() : Promise.resolve([]),
      ]);
      setMentors(m);
      setMatches(matchResults as MatchedMentor[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMentors(); }, [view, filters.type, filters.specialization, filters.branch]);

  const specializations = [...new Set(mentors.map(m => m.specialization).filter(Boolean))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find a Mentor"
        subtitle="Smart matching connects you with the right mentor based on your profile"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setView('recommended')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'recommended' ? 'bg-navy-700 text-white' : 'bg-white border border-navy-100 text-navy-600'}`}
            >
              <Sparkles className="w-4 h-4 inline mr-1.5" /> Recommended
            </button>
            <button
              onClick={() => setView('all')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'all' ? 'bg-navy-700 text-white' : 'bg-white border border-navy-100 text-navy-600'}`}
            >
              <Search className="w-4 h-4 inline mr-1.5" /> Browse All
            </button>
          </div>
        }
      />

      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input
            type="text"
            placeholder="Search by name, specialization, or bio..."
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && loadMentors()}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}><Filter className="w-4 h-4" /> Filters</Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Select label="Mentor Type" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="all">All Mentors</option>
              <option value="active_mentor">Active (Serving)</option>
              <option value="retired_mentor">Retired (Veteran)</option>
            </Select>
            <Select label="Specialization" value={filters.specialization} onChange={e => setFilters(f => ({ ...f, specialization: e.target.value }))}>
              <option value="all">All Specializations</option>
              {specializations.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Service Branch" value={filters.branch} onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}>
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </div>
          <div className="mt-3"><Button size="sm" onClick={loadMentors}>Apply Filters</Button></div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-md skeleton" />)}
        </div>
      ) : view === 'recommended' ? (
        /* Recommended Matches View */
        matches.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={<Sparkles className="w-10 h-10" />}
              title="No matches found"
              description="Complete your profile with career goals and mentorship interests to get better matches."
              action={<Button size="sm" onClick={() => setView('all')}>Browse All Mentors</Button>}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-navy-500">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span>Top {matches.length} matches based on your profile — compatibility scores shown below</span>
            </div>
            {matches.map((m, idx) => {
              const tc = tierColor(m.match.tier);
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Card hover className="p-5">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                      <Avatar name={m.full_name} src={m.avatar_url} size="lg" />
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 w-full">
                          <div className="flex flex-col items-center sm:items-start">
                            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                              <h3 className="font-bold text-navy-800">{m.full_name}</h3>
                              <Badge variant={m.role === 'retired_mentor' ? 'gold' : 'success'} dot>
                                {m.role === 'retired_mentor' ? 'Retired' : 'Active'}
                              </Badge>
                            </div>
                            <p className="text-sm text-navy-400 mt-0.5">{m.rank} · {m.specialization} · {m.command_location}</p>
                          </div>

                          {/* Match Score Circle */}
                          <div className={`flex flex-col items-center px-4 py-2 rounded-md ${tc.bg} ring-1 ${tc.ring} flex-shrink-0`}>
                            <span className={`text-2xl font-bold ${tc.color}`}>{m.match.percentage}%</span>
                            <span className={`text-[10px] font-medium ${tc.color} uppercase tracking-wide`}>{m.match.tier}</span>
                          </div>
                        </div>

                        {/* Compatibility Factors */}
                        <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-left">
                          {m.match.factors.map((f, i) => (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-navy-600">{f.label}</span>
                                <span className="text-xs text-navy-400">{f.value}/{f.max}</span>
                              </div>
                              <ProgressBar value={f.value} max={f.max} color={f.value === f.max ? 'green' : f.value > 0 ? 'gold' : 'navy'} />
                              <p className="text-[11px] text-navy-400 mt-0.5">{f.detail}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-center sm:justify-start gap-2">
                          <Link href={`/mentors/${m.id}`}>
                            <Button size="sm" variant="gold"><ChevronRight className="w-3.5 h-3.5" /> View Profile & Request</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* Browse All View */
        <div>
          {mentors.length === 0 ? (
            <Card className="p-6"><EmptyState icon={<Search className="w-10 h-10" />} title="No mentors found" description="Try adjusting your filters" /></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                >
                  <Card hover className="p-4 h-full flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar name={m.full_name} src={m.avatar_url} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy-800 truncate">{m.full_name}</p>
                        <p className="text-xs text-navy-400 truncate">{m.rank} · {m.specialization}</p>
                      </div>
                      <Badge variant={m.role === 'retired_mentor' ? 'gold' : 'success'}>{m.role === 'retired_mentor' ? 'Retired' : 'Active'}</Badge>
                    </div>
                    <p className="text-xs text-navy-500 mb-3 line-clamp-2 flex-1">{m.bio || `${m.years_of_service} years in ${m.service_branch}`}</p>
                    <div className="flex items-center gap-2 text-xs text-navy-400 mb-3">
                      <span>{m.command_location}</span>
                      {m.is_accepting_mentees && <Badge variant="success" dot>Available</Badge>}
                    </div>
                    <Link href={`/mentors/${m.id}`}><Button size="sm" variant="outline" className="w-full">View Profile <ChevronRight className="w-3.5 h-3.5" /></Button></Link>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
