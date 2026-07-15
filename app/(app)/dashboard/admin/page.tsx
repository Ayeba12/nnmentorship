"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Button, Avatar, Badge, Spinner, EmptyState, StatCard, RoleBadge, VerificationBadge, Pagination, SectionTitle } from '@/components/ui';
import { 
  Users, UserCheck, Clock, Calendar, ShieldCheck, TrendingUp, FileText, 
  Activity, UserCog, Target, Megaphone, Plus, Trash2, Edit3, X, 
  Settings, BookOpen, Library, Image as ImageIcon, Check 
} from 'lucide-react';
import type { AdminStats, AdminReports, Profile, AuditLog } from '@/lib/types';
import type { Course, BlogPost, LibraryItem } from '@/lib/types-phase2';

type Tab = 'overview' | 'verifications' | 'relationships' | 'reports' | 'announcements' | 'cms' | 'audit' | 'users';

const MOCK_NAVAL_IMAGES = [
  { path: '/naval_fleet_operations.png', label: 'Fleet Operations' },
  { path: '/naval_training_drill.png', label: 'Training Drill' },
  { path: '/naval_mentorship_session.png', label: 'Mentorship Session' },
  { path: '/naval_command_ceremony.png', label: 'Command Ceremony' }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<Profile[]>([]);
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [auditPage, setAuditPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [annPage, setAnnPage] = useState(1);
  const itemsPerPage = 10;

  // Announcements states
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', targetRole: 'ALL' });
  const [posting, setPosting] = useState(false);
  const [annSuccess, setAnnSuccess] = useState('');
  const [annError, setAnnError] = useState('');

  // CMS state variables
  const [cmsSubTab, setCmsSubTab] = useState<'courses' | 'blogs' | 'library'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  // Permissions modal states
  const [selectedUserPerms, setSelectedUserPerms] = useState<Profile | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permBlog, setPermBlog] = useState(false);
  const [permCourses, setPermCourses] = useState(false);
  const [permLibrary, setPermLibrary] = useState(false);

  // Add/Edit Modals states
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseDifficulty, setCourseDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [lessonsList, setLessonsList] = useState<{ title: string; content: string; duration_minutes: number; video_url: string }[]>([]);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogCoverImage, setBlogCoverImage] = useState<string | null>(null);
  const [isSavingBlog, setIsSavingBlog] = useState(false);

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [libTitle, setLibTitle] = useState('');
  const [libDesc, setLibDesc] = useState('');
  const [libCategory, setLibCategory] = useState('');
  const [libFormat, setLibFormat] = useState<'pdf' | 'document' | 'audio' | 'video'>('pdf');
  const [libExternalLink, setLibExternalLink] = useState('');
  const [libAuthor, setLibAuthor] = useState('');
  const [libRankLevel, setLibRankLevel] = useState('All');
  const [isSavingLibrary, setIsSavingLibrary] = useState(false);

  useEffect(() => {
    setAuditPage(1);
    setUsersPage(1);
    setAnnPage(1);
    setAnnSuccess('');
    setAnnError('');
  }, [tab]);

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.admin.stats();
      setStats(s);
      if (tab === 'verifications') setPending(await api.admin.pending());
      if (tab === 'reports') setReports(await api.admin.reports());
      if (tab === 'audit') setAuditLogs(await api.admin.audit());
      if (tab === 'users') setAllUsers(await api.admin.allUsers());
      if (tab === 'announcements') setAnnouncements(await api.announcements.list());
      if (tab === 'cms') {
        setCourses(await api.courses.list());
        setBlogs(await api.blog.list());
        setLibraryItems(await api.library.list());
      }
      if (tab === 'relationships') {
        const rep = await api.admin.reports();
        setReports(rep);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setAnnSuccess('');
    setAnnError('');
    try {
      await api.announcements.create({
        title: newAnn.title,
        content: newAnn.content,
        target_role: newAnn.targetRole
      });
      setAnnSuccess('Announcement successfully published and broadcasted!');
      setNewAnn({ title: '', content: '', targetRole: 'ALL' });
      const list = await api.announcements.list();
      setAnnouncements(list || []);
    } catch (err: any) {
      setAnnError(err.message || 'Failed to post announcement.');
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab, cmsSubTab]);

  const verify = async (id: number, status: string) => {
    await api.admin.verify(id, status);
    await load();
  };

  // Image upload base64 converter helper
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBlogCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handlers for CMS additions & edits
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCourse(true);
    try {
      await api.courses.create({
        title: courseTitle,
        description: courseDesc,
        category: courseCategory,
        difficulty: courseDifficulty,
        lessons: lessonsList
      });
      setIsCourseModalOpen(false);
      setCourseTitle('');
      setCourseDesc('');
      setCourseCategory('');
      setCourseDifficulty('beginner');
      setLessonsList([]);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to create course');
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBlog(true);
    try {
      const payload = {
        title: blogTitle,
        excerpt: blogExcerpt,
        content: blogContent,
        category: blogCategory,
        tags: blogTags,
        cover_image: blogCoverImage
      };

      if (selectedBlog) {
        await api.blog.update({ id: selectedBlog.id, ...payload });
      } else {
        await api.blog.create(payload);
      }

      setIsBlogModalOpen(false);
      setSelectedBlog(null);
      setBlogTitle('');
      setBlogExcerpt('');
      setBlogContent('');
      setBlogCategory('');
      setBlogTags('');
      setBlogCoverImage(null);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to save blog post');
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleSaveLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLibrary(true);
    try {
      const payload = {
        title: libTitle,
        description: libDesc,
        category: libCategory,
        format: libFormat,
        external_link: libExternalLink || null,
        author: libAuthor || null,
        rank_level: libRankLevel
      };

      if (selectedLibraryItem) {
        await api.library.update(selectedLibraryItem.id, payload);
      } else {
        await api.library.create(payload);
      }

      setIsLibraryModalOpen(false);
      setSelectedLibraryItem(null);
      setLibTitle('');
      setLibDesc('');
      setLibCategory('');
      setLibFormat('pdf');
      setLibExternalLink('');
      setLibAuthor('');
      setLibRankLevel('All');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to save library publication');
    } finally {
      setIsSavingLibrary(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course and all its lessons?')) return;
    try {
      await api.courses.delete(id);
      await load();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await api.blog.delete(id);
      await load();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const handleDeleteLibrary = async (id: number) => {
    if (!confirm('Are you sure you want to delete this publication?')) return;
    try {
      await api.library.delete(id);
      await load();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'verifications', label: 'Verify', icon: ShieldCheck },
    { key: 'relationships', label: 'Pairs', icon: UserCheck },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'cms', label: 'CMS Manager', icon: BookOpen },
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
          <p className="text-sm text-navy-400">Platform oversight & content management</p>
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
                <>
                  <div className="space-y-2">
                    {auditLogs.slice((auditPage - 1) * itemsPerPage, auditPage * itemsPerPage).map(log => (
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
                  <Pagination
                    currentPage={auditPage}
                    totalPages={Math.ceil(auditLogs.length / itemsPerPage)}
                    onPageChange={setAuditPage}
                  />
                </>
              )}
            </Card>
          )}

          {/* All Users */}
          {tab === 'users' && (
            <Card className="p-4 sm:p-5">
              <h2 className="font-bold text-navy-800 mb-4">All Users ({allUsers.length})</h2>
              {allUsers.length === 0 ? (
                <EmptyState icon={<Users className="w-10 h-10" />} title="No users registered" />
              ) : (
                <>
                  <div className="space-y-2">
                    {allUsers.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage).map(u => (
                      <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-navy-50/50 rounded-md border border-navy-100/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={u.full_name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy-800 truncate">{u.full_name}</p>
                            <p className="text-xs text-navy-400 truncate">{u.rank} · {u.specialization || u.service_branch}</p>
                            {/* Visual Indicator of CMS Permissions */}
                            <div className="flex items-center gap-1 mt-1">
                              {u.can_manage_blog && <Badge variant="info">Blog Editor</Badge>}
                              {u.can_manage_courses && <Badge variant="success">Courses Builder</Badge>}
                              {u.can_manage_library && <Badge variant="gold">Library Admin</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap pl-11 sm:pl-0">
                          <RoleBadge role={u.role} />
                          <VerificationBadge status={u.verification_status} />
                          <button
                            onClick={() => {
                              setSelectedUserPerms(u);
                              setPermBlog(!!u.can_manage_blog);
                              setPermCourses(!!u.can_manage_courses);
                              setPermLibrary(!!u.can_manage_library);
                              setIsPermissionsModalOpen(true);
                            }}
                            className="p-1 rounded-md text-navy-400 hover:text-navy-700 hover:bg-navy-50 border border-transparent hover:border-navy-100 transition-all cursor-pointer"
                            title="Manage Permissions"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={usersPage}
                    totalPages={Math.ceil(allUsers.length / itemsPerPage)}
                    onPageChange={setUsersPage}
                  />
                </>
              )}
            </Card>
          )}

          {/* Announcements Tab */}
          {tab === 'announcements' && (
            <div className="space-y-6">
              <Card className="p-4 sm:p-5">
                <SectionTitle icon={<Megaphone className="w-5 h-5" />}>
                  Publish General Announcement
                </SectionTitle>
                <p className="text-xs text-navy-400 mb-4">
                  Send a platform-wide system notification and broadcast alerts to target officer dashboards.
                </p>

                <form onSubmit={handlePostAnnouncement} className="space-y-4">
                  {annSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-xs font-semibold">
                      {annSuccess}
                    </div>
                  )}
                  {annError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs font-semibold">
                      {annError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-navy-700 mb-1">Announcement Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. System Maintenance Window / New Directives"
                        value={newAnn.title}
                        onChange={e => setNewAnn(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-md border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 mb-1">Target Audience</label>
                      <select
                        value={newAnn.targetRole}
                        onChange={e => setNewAnn(prev => ({ ...prev, targetRole: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-md border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white text-sm transition-all"
                      >
                        <option value="ALL">All Accounts (Mentors & Mentees)</option>
                        <option value="MENTOR">Mentors Only (Active & Retired)</option>
                        <option value="MENTEE">Mentees Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">Announcement Message Body</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write your announcement details here..."
                      value={newAnn.content}
                      onChange={e => setNewAnn(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-md border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white text-sm transition-all"
                    />
                  </div>

                  <Button type="submit" loading={posting} variant="gold" size="sm" className="font-bold">
                    Publish & Send Alert
                  </Button>
                </form>
              </Card>

              {/* Announcements History List */}
              <Card className="p-4 sm:p-5">
                <h2 className="font-bold text-navy-800 mb-4">Published History ({announcements.length})</h2>
                {announcements.length === 0 ? (
                  <EmptyState icon={<Megaphone className="w-10 h-10" />} title="No announcements published yet" />
                ) : (
                  <>
                    <div className="space-y-3">
                      {announcements.slice((annPage - 1) * itemsPerPage, annPage * itemsPerPage).map(ann => (
                        <div key={ann.id} className="p-3.5 bg-navy-50/30 rounded-md border border-navy-100/50 space-y-2">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-navy-800">{ann.title}</h3>
                              <p className="text-[10px] text-navy-400 mt-0.5">
                                Published by {ann.sender_name} · {new Date(ann.created_at).toLocaleString('en-GB')}
                              </p>
                            </div>
                            <Badge variant={ann.target_role === 'all' ? 'info' : ann.target_role === 'mentor' ? 'success' : 'gold'}>
                              {ann.target_role === 'all' ? 'All Roles' : ann.target_role === 'mentor' ? 'Mentors' : 'Mentees'}
                            </Badge>
                          </div>
                          <p className="text-xs text-navy-600 whitespace-pre-wrap leading-relaxed">
                            {ann.content}
                          </p>
                        </div>
                      ))}
                    </div>
                    <Pagination
                      currentPage={annPage}
                      totalPages={Math.ceil(announcements.length / itemsPerPage)}
                      onPageChange={setAnnPage}
                    />
                  </>
                )}
              </Card>
            </div>
          )}

          {/* CMS Manager Tab */}
          {tab === 'cms' && (
            <div className="space-y-6">
              {/* CMS Sub-tab bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-navy-100 pb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCmsSubTab('courses')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      cmsSubTab === 'courses' ? 'bg-navy-800 text-white shadow-soft' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                    }`}
                  >
                    Courses & Lessons ({courses.length})
                  </button>
                  <button
                    onClick={() => setCmsSubTab('blogs')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      cmsSubTab === 'blogs' ? 'bg-navy-800 text-white shadow-soft' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                    }`}
                  >
                    Blog Posts ({blogs.length})
                  </button>
                  <button
                    onClick={() => setCmsSubTab('library')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      cmsSubTab === 'library' ? 'bg-navy-800 text-white shadow-soft' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                    }`}
                  >
                    Library catalog ({libraryItems.length})
                  </button>
                </div>
                <div>
                  {cmsSubTab === 'courses' && (
                    <Button variant="gold" size="sm" className="font-bold flex items-center gap-1" onClick={() => router.push('/dashboard/admin/cms/courses/new')}>
                      <Plus className="w-4 h-4" /> Add Course
                    </Button>
                  )}
                  {cmsSubTab === 'blogs' && (
                    <Button variant="gold" size="sm" className="font-bold flex items-center gap-1" onClick={() => router.push('/dashboard/admin/cms/blog/new')}>
                      <Plus className="w-4 h-4" /> Add Blog Post
                    </Button>
                  )}
                  {cmsSubTab === 'library' && (
                    <Button variant="gold" size="sm" className="font-bold flex items-center gap-1" onClick={() => setIsLibraryModalOpen(true)}>
                      <Plus className="w-4 h-4" /> Add Publication
                    </Button>
                  )}
                </div>
              </div>

              {/* Courses list */}
              {cmsSubTab === 'courses' && (
                <Card className="p-4 sm:p-5">
                  <h2 className="font-bold text-navy-800 mb-4">Manage Mentorship Courses</h2>
                  {courses.length === 0 ? (
                    <EmptyState icon={<BookOpen className="w-10 h-10" />} title="No courses created yet" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-navy-50 border-b border-navy-100 text-navy-800 font-bold">
                            <th className="p-3">Course Title</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Difficulty</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-50">
                          {courses.map(c => (
                            <tr key={c.id} className="hover:bg-navy-50/20 text-navy-700">
                              <td className="p-3 font-semibold text-navy-800">{c.title}</td>
                              <td className="p-3">{c.category}</td>
                              <td className="p-3 capitalize">{c.difficulty}</td>
                              <td className="p-3">
                                <Badge variant={c.status === 'published' ? 'success' : c.status === 'rejected' ? 'danger' : 'gold'}>
                                  {c.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right space-x-1.5">
                                {c.status === 'pending' && (
                                  <>
                                    <Button size="sm" variant="success" onClick={async () => { await api.courses.approve(c.id); await load(); }}>Approve</Button>
                                    <Button size="sm" variant="danger" onClick={async () => { await api.courses.reject(c.id); await load(); }}>Reject</Button>
                                  </>
                                )}
                                <button onClick={() => router.push(`/dashboard/admin/cms/courses/edit/${c.id}`)} className="p-1 rounded text-navy-500 hover:bg-navy-50 cursor-pointer animate-hover" title="Edit Course">
                                  <Edit3 className="w-4 h-4 inline" />
                                </button>
                                <button onClick={() => handleDeleteCourse(c.id)} className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer animate-hover" title="Delete Course">
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}

              {/* Blogs list */}
              {cmsSubTab === 'blogs' && (
                <Card className="p-4 sm:p-5">
                  <h2 className="font-bold text-navy-800 mb-4">Manage Blog Articles</h2>
                  {blogs.length === 0 ? (
                    <EmptyState icon={<FileText className="w-10 h-10" />} title="No blog posts created yet" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-navy-50 border-b border-navy-100 text-navy-800 font-bold">
                            <th className="p-3">Cover</th>
                            <th className="p-3">Post Title</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-50">
                          {blogs.map(b => (
                            <tr key={b.id} className="hover:bg-navy-50/20 text-navy-700">
                              <td className="p-3">
                                {b.cover_image ? (
                                  <img src={b.cover_image} alt="" className="w-10 h-6 object-cover rounded border border-navy-100" />
                                ) : (
                                  <div className="w-10 h-6 bg-navy-100 rounded flex items-center justify-center text-[10px] text-navy-400">No Img</div>
                                )}
                              </td>
                              <td className="p-3 font-semibold text-navy-800">{b.title}</td>
                              <td className="p-3">{b.category}</td>
                              <td className="p-3">
                                <Badge variant={b.status === 'published' ? 'success' : b.status === 'rejected' ? 'danger' : 'gold'}>
                                  {b.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3 text-right space-x-1.5">
                                {b.status === 'pending_review' && (
                                  <>
                                    <Button size="sm" variant="success" onClick={async () => { await api.blog.approve(b.id); await load(); }}>Publish</Button>
                                    <Button size="sm" variant="danger" onClick={async () => { await api.blog.reject(b.id); await load(); }}>Reject</Button>
                                  </>
                                )}
                                <button 
                                  onClick={() => router.push(`/dashboard/admin/cms/blog/edit/${b.id}`)} 
                                  className="p-1 rounded text-navy-500 hover:bg-navy-50 cursor-pointer animate-hover" 
                                  title="Edit Post"
                                >
                                  <Edit3 className="w-4 h-4 inline" />
                                </button>
                                <button onClick={() => handleDeleteBlog(b.id)} className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer animate-hover" title="Delete Post">
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}

              {/* Library list */}
              {cmsSubTab === 'library' && (
                <Card className="p-4 sm:p-5">
                  <h2 className="font-bold text-navy-800 mb-4">Manage Library Catalog</h2>
                  {libraryItems.length === 0 ? (
                    <EmptyState icon={<Library className="w-10 h-10" />} title="No library documents created yet" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-navy-50 border-b border-navy-100 text-navy-800 font-bold">
                            <th className="p-3">Title</th>
                            <th className="p-3">Format</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Audience</th>
                            <th className="p-3">Downloads</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-50">
                          {libraryItems.map(item => (
                            <tr key={item.id} className="hover:bg-navy-50/20 text-navy-700">
                              <td className="p-3 font-semibold text-navy-800">{item.title}</td>
                              <td className="p-3 uppercase"><Badge variant="info">{item.format}</Badge></td>
                              <td className="p-3">{item.category}</td>
                              <td className="p-3">{item.rank_level}</td>
                              <td className="p-3 font-bold">{item.downloads_count || 0}</td>
                              <td className="p-3 text-right space-x-1.5">
                                <button 
                                  onClick={() => {
                                    setSelectedLibraryItem(item);
                                    setLibTitle(item.title);
                                    setLibDesc(item.description);
                                    setLibCategory(item.category);
                                    setLibFormat(item.format);
                                    setLibExternalLink(item.external_link || '');
                                    setLibAuthor(item.author || '');
                                    setLibRankLevel(item.rank_level);
                                    setIsLibraryModalOpen(true);
                                  }} 
                                  className="p-1 rounded text-navy-500 hover:bg-navy-50 cursor-pointer animate-hover" 
                                  title="Edit Info"
                                >
                                  <Edit3 className="w-4 h-4 inline" />
                                </button>
                                <button onClick={() => handleDeleteLibrary(item.id)} className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer animate-hover" title="Delete Doc">
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Permissions Configuration Modal */}
      {isPermissionsModalOpen && selectedUserPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-pro relative bg-white">
            <button onClick={() => setIsPermissionsModalOpen(false)} className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-navy-800">CMS Permissions Manager</h3>
            <p className="text-xs text-navy-400">
              Grant or revoke editing privileges for <strong className="text-navy-700">{selectedUserPerms.full_name}</strong>.
            </p>
            <div className="space-y-3 py-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-navy-100 hover:bg-navy-50/50 transition-all cursor-pointer">
                <input type="checkbox" checked={permBlog} onChange={(e) => setPermBlog(e.target.checked)} className="mt-1 accent-gold-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-800">Blog Editor</p>
                  <p className="text-xs text-navy-400">Can create, edit, and publish blog post articles.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-navy-100 hover:bg-navy-50/50 transition-all cursor-pointer">
                <input type="checkbox" checked={permCourses} onChange={(e) => setPermCourses(e.target.checked)} className="mt-1 accent-gold-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-800">Courses & Lessons Builder</p>
                  <p className="text-xs text-navy-400">Can manage curricula, lessons structure, and quizzes.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-navy-100 hover:bg-navy-50/50 transition-all cursor-pointer">
                <input type="checkbox" checked={permLibrary} onChange={(e) => setPermLibrary(e.target.checked)} className="mt-1 accent-gold-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-800">Library Publications Curator</p>
                  <p className="text-xs text-navy-400">Can manage documents, manuals catalog, and external links.</p>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsPermissionsModalOpen(false)}>Cancel</Button>
              <Button
                variant="gold"
                size="sm"
                className="font-bold"
                onClick={async () => {
                  try {
                    await api.profiles.updatePermissions(selectedUserPerms.id, {
                      can_manage_blog: permBlog,
                      can_manage_courses: permCourses,
                      can_manage_library: permLibrary
                    });
                    setIsPermissionsModalOpen(false);
                    await load();
                  } catch (e: any) {
                    alert(e.message || 'Failed to save permissions');
                  }
                }}
              >
                Save Permissions
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 space-y-4 shadow-pro relative bg-white my-8">
            <button onClick={() => setIsCourseModalOpen(false)} className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-navy-800">Add Mentorship Course</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-navy-700 mb-1">Course Title</label>
                  <input type="text" required placeholder="e.g. Celestial Navigation Basics" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Difficulty</label>
                  <select value={courseDifficulty} onChange={e => setCourseDifficulty(e.target.value as any)} className="w-full p-2 border border-navy-200 rounded focus:outline-none">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Category</label>
                  <input type="text" required placeholder="e.g. Navigation / Tactics" value={courseCategory} onChange={e => setCourseCategory(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Description</label>
                <textarea required rows={3} placeholder="Course summary..." value={courseDesc} onChange={e => setCourseDesc(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
              </div>

              {/* Dynamic Lessons list builder */}
              <div className="border border-navy-100 rounded-md p-3 bg-navy-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-navy-800">Lessons Builder ({lessonsList.length})</h4>
                  <Button type="button" size="sm" variant="outline" className="flex items-center gap-0.5" onClick={() => setLessonsList([...lessonsList, { title: '', content: '', duration_minutes: 15, video_url: '' }])}>
                    <Plus className="w-3.5 h-3.5" /> Add Lesson
                  </Button>
                </div>

                {lessonsList.length === 0 ? (
                  <p className="text-[11px] text-navy-400 italic">No lessons added yet. Click Add Lesson above.</p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {lessonsList.map((les, index) => (
                      <div key={index} className="p-3 bg-white rounded border border-navy-100 relative space-y-2">
                        <button type="button" onClick={() => setLessonsList(lessonsList.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-red-400 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block font-semibold text-navy-700 mb-0.5">Lesson {index + 1} Title</label>
                            <input type="text" required placeholder="Lesson title" value={les.title} onChange={e => {
                              const updated = [...lessonsList];
                              updated[index].title = e.target.value;
                              setLessonsList(updated);
                            }} className="w-full p-1.5 border border-navy-100 rounded text-[11px]" />
                          </div>
                          <div>
                            <label className="block font-semibold text-navy-700 mb-0.5">Duration (min)</label>
                            <input type="number" required value={les.duration_minutes} onChange={e => {
                              const updated = [...lessonsList];
                              updated[index].duration_minutes = Number(e.target.value);
                              setLessonsList(updated);
                            }} className="w-full p-1.5 border border-navy-100 rounded text-[11px]" />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-navy-700 mb-0.5">Video Resource Link (Optional)</label>
                          <input type="text" placeholder="https://..." value={les.video_url} onChange={e => {
                            const updated = [...lessonsList];
                            updated[index].video_url = e.target.value;
                            setLessonsList(updated);
                          }} className="w-full p-1.5 border border-navy-100 rounded text-[11px]" />
                        </div>
                        <div>
                          <label className="block font-semibold text-navy-700 mb-0.5">Lesson Material Text Content</label>
                          <textarea required rows={2} placeholder="Write lesson training material..." value={les.content} onChange={e => {
                            const updated = [...lessonsList];
                            updated[index].content = e.target.value;
                            setLessonsList(updated);
                          }} className="w-full p-1.5 border border-navy-100 rounded text-[11px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCourseModalOpen(false)}>Cancel</Button>
                <Button type="submit" loading={isCreatingCourse} variant="gold" size="sm" className="font-bold">Publish Course</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Blog Modal */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 space-y-4 shadow-pro relative bg-white my-8">
            <button onClick={() => { setIsBlogModalOpen(false); setSelectedBlog(null); }} className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-navy-800">{selectedBlog ? 'Edit Blog Article' : 'Write Blog Article'}</h3>
            <form onSubmit={handleSaveBlog} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-navy-700 mb-1">Article Title</label>
                  <input type="text" required placeholder="e.g. Modern Hydrography in the Delta" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Category</label>
                  <input type="text" required placeholder="e.g. Operations / Careers" value={blogCategory} onChange={e => setBlogCategory(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
                </div>
              </div>

              {/* Cover Image Selection Options */}
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Cover Image Source</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* File Upload (Base64 offline fallback) */}
                    <div className="border border-dashed border-navy-200 rounded-md p-3 flex flex-col items-center justify-center bg-navy-50/20 hover:bg-navy-50 transition-all relative">
                      <ImageIcon className="w-6 h-6 text-navy-400 mb-1" />
                      <p className="text-[10px] text-navy-500 font-semibold">Upload Photo</p>
                      <p className="text-[9px] text-navy-300">Drag file or click</p>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>

                    {/* Custom URL Text Field */}
                    <div className="flex flex-col justify-center">
                      <label className="block font-semibold text-navy-700 mb-0.5">Custom Image URL</label>
                      <input type="text" placeholder="https://..." value={blogCoverImage || ''} onChange={e => setBlogCoverImage(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:outline-none text-[11px]" />
                    </div>
                  </div>
                </div>

                {/* Pre-installed Quick Assets Picker */}
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Or Quick-Select Naval Imagery</label>
                  <div className="grid grid-cols-4 gap-2">
                    {MOCK_NAVAL_IMAGES.map(img => (
                      <button
                        type="button"
                        key={img.path}
                        onClick={() => setBlogCoverImage(img.path)}
                        className={`group relative h-12 rounded overflow-hidden border transition-all cursor-pointer ${
                          blogCoverImage === img.path ? 'border-gold-500 ring-2 ring-gold-500/30' : 'border-navy-100 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.path} alt={img.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-navy-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] text-white font-bold whitespace-nowrap">{img.label}</span>
                        </div>
                        {blogCoverImage === img.path && (
                          <div className="absolute top-1 right-1 bg-gold-500 rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Live Preview */}
                {blogCoverImage && (
                  <div className="p-2 bg-navy-50 rounded border border-navy-100 flex items-center gap-3">
                    <img src={blogCoverImage} alt="Cover preview" className="w-16 h-10 object-cover rounded border border-navy-200 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-navy-800 truncate">Selected Image Path</p>
                      <p className="text-[9px] text-navy-400 truncate">{blogCoverImage}</p>
                    </div>
                    <button type="button" onClick={() => setBlogCoverImage(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-navy-700 mb-1">Excerpt Summary</label>
                <input type="text" required placeholder="A brief one-line description of the article..." value={blogExcerpt} onChange={e => setBlogExcerpt(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Tags (Comma-separated)</label>
                  <input type="text" placeholder="e.g. Navigation, Operations, Coastal" value={blogTags} onChange={e => setBlogTags(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Article Content</label>
                <textarea required rows={5} placeholder="Write your publication article details here..." value={blogContent} onChange={e => setBlogContent(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setIsBlogModalOpen(false); setSelectedBlog(null); }}>Cancel</Button>
                <Button type="submit" loading={isSavingBlog} variant="gold" size="sm" className="font-bold">Publish Post</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Library Modal */}
      {isLibraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg p-6 space-y-4 shadow-pro relative bg-white my-8">
            <button onClick={() => { setIsLibraryModalOpen(false); setSelectedLibraryItem(null); }} className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-navy-800">{selectedLibraryItem ? 'Edit Library Item' : 'Add Library Publication'}</h3>
            <form onSubmit={handleSaveLibrary} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Document Title</label>
                <input type="text" required placeholder="e.g. Naval Patrol Signals Handbook" value={libTitle} onChange={e => setLibTitle(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Category</label>
                  <input type="text" required placeholder="e.g. Navigation / Signals" value={libCategory} onChange={e => setLibCategory(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Format Type</label>
                  <select value={libFormat} onChange={e => setLibFormat(e.target.value as any)} className="w-full p-2 border border-navy-200 rounded focus:outline-none">
                    <option value="pdf">PDF File</option>
                    <option value="document">Doc File</option>
                    <option value="audio">Audio Resource</option>
                    <option value="video">Video Resource</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Author/Publisher</label>
                  <input type="text" placeholder="e.g. Naval Headquarters" value={libAuthor} onChange={e => setLibAuthor(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-navy-700 mb-1">Target Audience</label>
                  <input type="text" placeholder="e.g. All / Junior Officers" value={libRankLevel} onChange={e => setLibRankLevel(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Document File/External URL</label>
                <input type="text" required placeholder="https://..." value={libExternalLink} onChange={e => setLibExternalLink(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
              </div>
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Description</label>
                <textarea required rows={3} placeholder="Provide summary details of the file..." value={libDesc} onChange={e => setLibDesc(e.target.value)} className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-gold-400/40 focus:outline-none" />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setIsLibraryModalOpen(false); setSelectedLibraryItem(null); }}>Cancel</Button>
                <Button type="submit" loading={isSavingLibrary} variant="gold" size="sm" className="font-bold">Publish Item</Button>
              </div>
            </form>
          </Card>
        </div>
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
