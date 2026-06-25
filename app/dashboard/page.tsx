"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import { Card, Button, Avatar, Badge, Spinner, EmptyState, ProgressBar, RoleBadge, VerificationBadge, StatCard, SectionTitle } from '@/components/ui';
import type { Relationship, Session, Goal, MentorshipRequest, AdminStats } from '@/lib/types';
import { Users, Calendar, Target, MessageSquare, UserCheck, Clock, TrendingUp, ShieldCheck, Search, BookOpen, Newspaper, Library, ChevronRight, UserPlus } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!profile) return;
      try {
        const [rels, sess, gls, reqs] = await Promise.all([
          api.relationships.list(),
          api.sessions.list(),
          api.goals.list(),
          api.requests.list(),
        ]);
        setRelationships(rels);
        setSessions(sess);
        setGoals(gls);
        setRequests(reqs);
        if (profile.role === 'admin') {
          const [s, p] = await Promise.all([api.admin.stats(), api.admin.pending()]);
          setStats(s);
          setPendingUsers(p);
        }
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  if (loading) return (
    <div className="space-y-5">
      <div className="h-24 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-lg skeleton" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="h-56 rounded-lg skeleton" />
        <div className="h-56 rounded-lg skeleton" />
      </div>
    </div>
  );
  if (!profile) return null;

  const activeRels = relationships.filter(r => r.status === 'active');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date()).slice(0, 5);
  const pendingRequests = requests.filter(r => r.status === 'pending' && r.mentor_id === profile.id);
  const activeGoals = goals.filter(g => g.status === 'active');

  const quickActions = [
    { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/dashboard/sessions', icon: Calendar, label: 'Sessions' },
    { href: '/dashboard/goals', icon: Target, label: 'Goals' },
    { href: '/dashboard/courses', icon: BookOpen, label: 'Courses' },
    { href: '/dashboard/blog', icon: Newspaper, label: 'Blog' },
    { href: '/dashboard/library', icon: Library, label: 'Library' },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-lg border border-navy-100 shadow-soft p-5 lg:p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
            <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
            <div>
              <p className="text-navy-400 text-xs font-medium">Welcome back</p>
              <h1 className="text-xl font-bold text-navy-800 tracking-tight">{profile.full_name.split(' ')[0]}</h1>
              <p className="text-navy-400 text-sm mt-0.5">{profile.rank} · {profile.specialization || profile.service_branch}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <RoleBadge role={profile.role} />
                <VerificationBadge status={profile.verification_status} />
              </div>
            </div>
          </div>
          {profile.role === 'mentee' && (
            <Link href="/mentors">
              <Button variant="primary"><Search className="w-3.5 h-3.5" /> Find a Mentor</Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Admin Dashboard */}
      {profile.role === 'admin' && stats && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.total_users} icon={<Users className="w-4 h-4" />} />
            <StatCard label="Active Pairs" value={stats.active_relationships} icon={<UserCheck className="w-4 h-4" />} color="green" />
            <StatCard label="Pending Reviews" value={stats.pending_verifications} icon={<Clock className="w-4 h-4" />} color="gold" />
            <StatCard label="Sessions (Month)" value={stats.sessions_this_month} icon={<Calendar className="w-4 h-4" />} color="ocean" />
          </div>

          {pendingUsers.length > 0 && (
            <Card className="p-5">
              <SectionTitle icon={<ShieldCheck className="w-4 h-4" />} action={<Link href="/admin"><Button size="sm" variant="ghost">View all <ChevronRight className="w-3 h-3" /></Button></Link>}>
                Pending Verifications ({pendingUsers.length})
              </SectionTitle>
              <div className="space-y-1.5">
                {pendingUsers.slice(0, 4).map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-navy-50/50 rounded-md border border-navy-100/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={u.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-800 truncate">{u.full_name}</p>
                        <p className="text-xs text-navy-400 truncate">{u.rank} · {u.service_branch} · {u.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 self-end sm:self-center">
                      <Button size="sm" variant="success" onClick={async () => { await api.admin.verify(u.id, 'verified'); window.location.reload(); }}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={async () => { await api.admin.verify(u.id, 'rejected'); window.location.reload(); }}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Link href="/admin">
            <Card hover className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-navy-50 flex items-center justify-center text-navy-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-navy-800">Reports & Analytics</h2>
                  <p className="text-xs text-navy-400">View match rates, goal completion, retention metrics</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-300" />
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Mentor: Pending Requests */}
      {profile.role !== 'mentee' && profile.role !== 'admin' && pendingRequests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <Card className="p-5">
            <SectionTitle icon={<div className="w-6 h-6 rounded bg-gold-50 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-gold-600" /></div>}>
              Pending Mentorship Requests ({pendingRequests.length})
            </SectionTitle>
            <div className="space-y-1.5">
              {pendingRequests.map(req => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-navy-50/50 rounded-md border border-navy-100/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={req.mentee?.full_name || 'Unknown'} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-800 truncate">{req.mentee?.full_name}</p>
                      <p className="text-xs text-navy-400 truncate">{req.mentee?.rank} · {req.mentee?.specialization}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 self-end sm:self-center">
                    <Button size="sm" variant="success" onClick={async () => { await api.requests.accept(req.id); window.location.reload(); }}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={async () => { await api.requests.decline(req.id); window.location.reload(); }}>Decline</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickActions.map(action => (
            <Link key={action.href} href={action.href}>
              <Card hover className="p-3.5 text-center group cursor-pointer">
                <div className="w-9 h-9 rounded-md bg-navy-50 flex items-center justify-center mx-auto mb-1.5 text-navy-500 group-hover:bg-navy-100 transition-colors">
                  <action.icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-navy-600">{action.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* My Connections */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card className="p-5 h-full">
            <SectionTitle icon={<Users className="w-4 h-4" />}>
              {profile.role === 'mentee' ? 'My Mentors' : 'My Mentees'}
            </SectionTitle>
            {activeRels.length === 0 ? (
              <EmptyState icon={<Users className="w-7 h-7" />} title="No active connections" description={profile.role === 'mentee' ? 'Find a mentor to get started' : 'Accept requests to start mentoring'} action={profile.role === 'mentee' ? <Link href="/mentors"><Button size="sm" variant="primary"><Search className="w-3.5 h-3.5" /> Find a Mentor</Button></Link> : undefined} />
            ) : (
              <div className="space-y-1">
                {activeRels.map(rel => {
                  const other = profile.role === 'mentee' ? rel.mentor : rel.mentee;
                  if (!other) return null;
                  return (
                    <Link key={rel.id} href="/messages" className="flex items-center gap-2.5 p-2.5 hover:bg-navy-50 rounded-md transition-colors group border border-transparent hover:border-navy-100">
                      <Avatar name={other.full_name} src={other.avatar_url} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-800 truncate">{other.full_name}</p>
                        <p className="text-xs text-navy-400 truncate">{other.rank} · {other.specialization}</p>
                      </div>
                      <Badge variant={other.role === 'retired_mentor' ? 'gold' : 'success'} dot>{other.role === 'retired_mentor' ? 'Retired' : 'Active'}</Badge>
                      <ChevronRight className="w-3.5 h-3.5 text-navy-300 group-hover:text-navy-500 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="p-5 h-full">
            <SectionTitle icon={<Calendar className="w-4 h-4" />}>
              Upcoming Sessions
            </SectionTitle>
            {upcomingSessions.length === 0 ? (
              <EmptyState icon={<Calendar className="w-7 h-7" />} title="No upcoming sessions" description="Book a session with your mentor or mentee" action={<Link href="/sessions"><Button size="sm" variant="outline">View Sessions</Button></Link>} />
            ) : (
              <div className="space-y-1.5">
                {upcomingSessions.map(s => (
                  <div key={s.id} className="flex items-center gap-2.5 p-2.5 bg-navy-50/50 rounded-md border border-navy-100/50">
                    <div className="w-10 h-10 rounded-md bg-white border border-navy-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-medium text-navy-400 leading-none uppercase">{new Date(s.scheduled_at).toLocaleDateString('en-GB', { month: 'short' })}</span>
                      <span className="text-sm font-bold text-navy-700 leading-none mt-0.5">{new Date(s.scheduled_at).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-800">{new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-xs text-navy-400">{s.duration_minutes} min · {s.session_type === 'booked_slot' ? 'Booked slot' : 'Proposed time'}</p>
                    </div>
                    <Badge variant="info" dot>Scheduled</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Goals Progress */}
      {activeGoals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <Card className="p-5">
            <SectionTitle icon={<Target className="w-4 h-4" />} action={<Link href="/goals"><Button size="sm" variant="ghost">View all <ChevronRight className="w-3 h-3" /></Button></Link>}>
              Goals Progress
            </SectionTitle>
            <div className="space-y-3.5">
              {activeGoals.slice(0, 5).map(g => {
                const total = g.milestones?.length || 0;
                const done = g.milestones?.filter(m => m.completed).length || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-navy-700">{g.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-navy-400">{done}/{total} milestones</span>
                        <span className="text-xs font-semibold text-navy-600">{pct}%</span>
                      </div>
                    </div>
                    <ProgressBar value={done} max={Math.max(total, 1)} color={pct === 100 ? 'green' : 'gold'} />
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
