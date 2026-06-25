"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, Button, Avatar, Badge, Spinner, EmptyState, StatCard, RoleBadge, VerificationBadge } from '@/components/ui';
import { Users, UserCheck, Clock, Calendar, ShieldCheck, TrendingUp, FileText, Activity, UserCog, Target } from 'lucide-react';
import type { AdminStats, AdminReports, Profile, AuditLog } from '@/lib/types';

type Tab = 'overview' | 'verifications' | 'relationships' | 'reports' | 'audit' | 'users';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<Profile[]>([]);
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.admin.stats();
      setStats(s);
      if (tab === 'verifications') setPending(await api.admin.pending());
      if (tab === 'reports') setReports(await api.admin.reports());
      if (tab === 'audit') setAuditLogs(await api.admin.audit());
      if (tab === 'users') setAllUsers(await api.admin.allUsers());
      if (tab === 'relationships') {
        // If reports has not been loaded, load reports as it contains the relationships list
        const rep = await api.admin.reports();
        setReports(rep);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const verify = async (id: number, status: string) => {
    await api.admin.verify(id, status);
    await load();
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'verifications', label: 'Verify', icon: ShieldCheck },
    { key: 'relationships', label: 'Pairs', icon: UserCheck },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'audit', label: 'Audit', icon: Activity },
    { key: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center shadow-soft flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-gold-500" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-navy-800 tracking-tight">Admin Console</h1>
          <p className="text-sm text-navy-400">Platform oversight & management</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
              tab === t.key
                ? 'bg-navy-700 text-white shadow-soft'
                : 'bg-white text-navy-600 hover:bg-navy-50 border border-navy-100'
            }`}
          >
            <t.icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-md skeleton" />)}
          </div>
          <div className="h-48 rounded-md skeleton" />
        </div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Total Users" value={stats.total_users} icon={<Users className="w-5 h-5" />} />
                <StatCard label="Verified Mentors" value={stats.total_mentors} icon={<UserCheck className="w-5 h-5" />} color="green" />
                <StatCard label="Verified Mentees" value={stats.total_mentees} icon={<UserCog className="w-5 h-5" />} color="navy" />
                <StatCard label="Active Pairs" value={stats.active_relationships} icon={<UserCheck className="w-5 h-5" />} color="green" />
                <StatCard label="Pending Reviews" value={stats.pending_verifications} icon={<Clock className="w-5 h-5" />} color="gold" />
                <StatCard label="Sessions (Month)" value={stats.sessions_this_month} icon={<Calendar className="w-5 h-5" />} color="ocean" />
              </div>
              {stats.pending_verifications > 0 && (
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-5 h-5 text-gold-500 flex-shrink-0" />
                      <h2 className="font-bold text-navy-800 truncate">Pending Verifications</h2>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setTab('verifications')} className="flex-shrink-0">View All</Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Verifications */}
          {tab === 'verifications' && (
            <Card className="p-4 sm:p-5">
              <h2 className="font-bold text-navy-800 mb-4">Pending Verification ({pending.length})</h2>
              {pending.length === 0 ? (
                <EmptyState icon={<ShieldCheck className="w-10 h-10" />} title="No pending verifications" description="All accounts have been reviewed." />
              ) : (
                <div className="space-y-3">
                  {pending.map(u => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-navy-50/50 rounded-md border border-navy-100/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={u.full_name} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy-800 truncate">{u.full_name}</p>
                          <p className="text-xs text-navy-400 truncate">{u.rank} · {u.service_branch} · {u.service_number || 'No service number'}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <RoleBadge role={u.role} />
                            {u.role === 'retired_mentor' && <Badge variant="gold">Separate vetting</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="success" onClick={() => verify(u.id, 'verified')}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => verify(u.id, 'rejected')}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Relationships */}
          {tab === 'relationships' && reports && (
            <Card className="p-4 sm:p-5">
              <h2 className="font-bold text-navy-800 mb-4">All Mentorship Relationships</h2>
              {reports.all_relationships.length === 0 ? (
                <EmptyState icon={<UserCheck className="w-10 h-10" />} title="No relationships yet" />
              ) : (
                <div className="space-y-3">
                  {reports.all_relationships.map(r => (
                    <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-navy-50/50 rounded-md border border-navy-100/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex -space-x-2 flex-shrink-0">
                          <Avatar name={r.mentee?.full_name || 'M'} size="sm" />
                          <Avatar name={r.mentor?.full_name || 'M'} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy-800 truncate">{r.mentee?.full_name} ↔ {r.mentor?.full_name}</p>
                          <p className="text-xs text-navy-400">Started {new Date(r.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <Badge variant={r.status === 'active' ? 'success' : 'default'} dot>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Reports */}
          {tab === 'reports' && reports && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Match Rate" value={`${reports.match_rate}%`} icon={<TrendingUp className="w-5 h-5" />} color="green" />
                <StatCard label="Total Matches" value={reports.total_matches} icon={<UserCheck className="w-5 h-5" />} />
                <StatCard label="Sessions Done" value={reports.sessions_completed} icon={<Calendar className="w-5 h-5" />} color="navy" />
                <StatCard label="Goal Completion" value={`${reports.goal_completion}%`} icon={<Target className="w-5 h-5" />} color="gold" />
                <StatCard label="Total Goals" value={reports.total_goals} icon={<Target className="w-5 h-5" />} />
                <StatCard label="Goals Done" value={reports.completed_goals} icon={<Target className="w-5 h-5" />} color="green" />
                <StatCard label="Retention Rate" value={`${reports.retention_rate}%`} icon={<TrendingUp className="w-5 h-5" />} color="green" />
                <StatCard label="Long-term Pairs" value={reports.long_term_relationships} icon={<Clock className="w-5 h-5" />} color="ocean" />
              </div>
              <Card className="p-4 sm:p-5">
                <h3 className="font-bold text-navy-800 mb-3">Success Metrics Summary</h3>
                <div className="space-y-1 text-sm">
                  <MetricRow label="Match Rate" description="Mentees paired within target timeframe" value={`${reports.match_rate}%`} />
                  <MetricRow label="Goal Completion" description="Share of mentee goals reached" value={`${reports.goal_completion}%`} />
                  <MetricRow label="Retention (6+ months)" description="Active pairings over 6-12 months" value={`${reports.retention_rate}%`} />
                  <MetricRow label="Sessions Completed" description="Total completed sessions logged" value={String(reports.sessions_completed)} />
                </div>
              </Card>
            </div>
          )}

          {/* Audit Log */}
          {tab === 'audit' && (
            <Card className="p-4 sm:p-5">
              <h2 className="font-bold text-navy-800 mb-4">Audit Log</h2>
              {auditLogs.length === 0 ? (
                <EmptyState icon={<Activity className="w-10 h-10" />} title="No audit entries" />
              ) : (
                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-navy-50/50 rounded-md border border-navy-100/50">
                      <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-navy-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-navy-800"><span className="font-medium">{log.actor?.full_name || 'System'}</span> — {log.action.replace(/_/g, ' ')}</p>
                        {log.details && <p className="text-xs text-navy-400 mt-0.5 break-words">{log.details}</p>}
                        <p className="text-[10px] text-navy-300 mt-0.5">{new Date(log.created_at).toLocaleString('en-GB')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* All Users */}
          {tab === 'users' && (
            <Card className="p-4 sm:p-5">
              <h2 className="font-bold text-navy-800 mb-4">All Users ({allUsers.length})</h2>
              <div className="space-y-2">
                {allUsers.map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-navy-50/50 rounded-md border border-navy-100/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={u.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-800 truncate">{u.full_name}</p>
                        <p className="text-xs text-navy-400 truncate">{u.rank} · {u.specialization || u.service_branch}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pl-11 sm:pl-0">
                      <RoleBadge role={u.role} />
                      <VerificationBadge status={u.verification_status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricRow({ label, description, value }: { label: string; description: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-navy-100 last:border-0">
      <div className="min-w-0">
        <p className="font-medium text-navy-700">{label}</p>
        <p className="text-xs text-navy-400">{description}</p>
      </div>
      <p className="text-lg font-bold text-navy-800 flex-shrink-0">{value}</p>
    </div>
  );
}
