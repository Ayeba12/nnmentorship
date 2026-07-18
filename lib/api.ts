/* eslint-disable @typescript-eslint/no-explicit-any */
import supabase from './supabase';
import type { Profile, MentorshipRequest, Relationship, Message, Session, Goal, AvailabilitySlot, AuditLog, MatchedMentor, AdminStats, AdminReports, AppEvent, EventRegistration } from './types';
import type { Course, Enrollment, BlogPost, BlogComment, LibraryItem, ReadingList } from './types-phase2';

async function getHeaders(): Promise<Record<string, string>> {
  let token: string | null = null;
  
  if (typeof window !== 'undefined') {
    const mockSessionStr = localStorage.getItem('mock_session');
    if (mockSessionStr) {
      try {
        const parsed = JSON.parse(mockSessionStr);
        token = parsed?.access_token || null;
      } catch (e) {
        // ignore
      }
    }
  }

  if (!token) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    } catch (e) {
      console.error('getHeaders real session check error:', e);
    }
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(path, {
    ...options,
    cache: 'no-store',
    headers: { ...headers, ...(options?.headers || {}) }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  profiles: {
    me: () => apiFetch<Profile>('/api/profiles?me=true'),
    get: (id: number) => apiFetch<Profile>(`/api/profiles?id=${id}`),
    directory: () => apiFetch<Profile[]>('/api/profiles?directory=true'),
    mentors: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams({ mentors: 'true', ...params }).toString();
      return apiFetch<Profile[]>(`/api/profiles?${qs}`);
    },
    create: (data: Partial<Profile>) => apiFetch<Profile>('/api/profiles', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: Partial<Profile>) => apiFetch<Profile>('/api/profiles', { method: 'PUT', body: JSON.stringify(data) }),
    verify: (id: number, status: string) => apiFetch<Profile>('/api/profiles?action=verify', { method: 'PUT', body: JSON.stringify({ id, verification_status: status }) }),
    updatePermissions: (id: number, permissions: { can_manage_blog: boolean; can_manage_courses: boolean; can_manage_library: boolean }) =>
      apiFetch<Profile>('/api/profiles?action=permissions', { method: 'PUT', body: JSON.stringify({ id, ...permissions }) }),
  },
  matching: {
    for: () => apiFetch<MatchedMentor[]>('/api/matching'),
    detailed: () => apiFetch<MatchedMentor[]>('/api/matching?detailed=true'),
    forMentor: (mentor_id: number) => apiFetch<MatchedMentor>(`/api/matching?mentor_id=${mentor_id}`),
  },
  requests: {
    list: () => apiFetch<(MentorshipRequest & { mentee?: Profile; mentor?: Profile })[]>('/api/requests'),
    create: (mentor_id: number, message: string, request_type?: string) =>
      apiFetch<MentorshipRequest>('/api/requests', { method: 'POST', body: JSON.stringify({ mentor_id, message, request_type }) }),
    accept: (id: number) => apiFetch<{ request: MentorshipRequest; relationship: Relationship }>('/api/requests?action=accept', { method: 'PUT', body: JSON.stringify({ id }) }),
    decline: (id: number) => apiFetch<MentorshipRequest>('/api/requests?action=decline', { method: 'PUT', body: JSON.stringify({ id }) }),
  },
  relationships: {
    list: () => apiFetch<(Relationship & { mentee?: Profile; mentor?: Profile })[]>('/api/relationships'),
    end: (id: number, reason: string) => apiFetch<Relationship>('/api/relationships', { method: 'PUT', body: JSON.stringify({ id, end_reason: reason }) }),
    assign: (mentee_id: number, mentor_id: number) => apiFetch<Relationship>('/api/relationships', { method: 'POST', body: JSON.stringify({ mentee_id, mentor_id }) }),
  },
  messages: {
    list: (relationship_id: number) => apiFetch<Message[]>(`/api/messages?relationship_id=${relationship_id}`),
    send: (relationship_id: number, content: string) => apiFetch<Message>('/api/messages', { method: 'POST', body: JSON.stringify({ relationship_id, content }) }),
  },
  sessions: {
    list: () => apiFetch<Session[]>('/api/sessions'),
    listForRelationship: (relationship_id: number) => apiFetch<Session[]>(`/api/sessions?relationship_id=${relationship_id}`),
    book: (relationship_id: number, scheduled_at: string, duration_minutes: number, session_type: string, agenda?: string) =>
      apiFetch<Session>('/api/sessions', { method: 'POST', body: JSON.stringify({ relationship_id, scheduled_at, duration_minutes, session_type, agenda }) }),
    update: (id: number, updates: Partial<Session>) => apiFetch<Session>('/api/sessions', { method: 'PUT', body: JSON.stringify({ id, ...updates }) }),
    confirm: (id: number) => apiFetch<Session>('/api/sessions', { method: 'PUT', body: JSON.stringify({ id, action: 'confirm' }) }),
    rejectProposal: (id: number) => apiFetch<Session>('/api/sessions', { method: 'PUT', body: JSON.stringify({ id, action: 'reject_proposal' }) }),
  },
  goals: {
    list: () => apiFetch<Goal[]>('/api/goals'),
    listForRelationship: (relationship_id: number) => apiFetch<Goal[]>(`/api/goals?relationship_id=${relationship_id}`),
    create: (data: Partial<Goal>) => apiFetch<Goal>('/api/goals', { method: 'POST', body: JSON.stringify(data) }),
    addMilestone: (goal_id: number, title: string) => apiFetch('/api/goals', { method: 'POST', body: JSON.stringify({ action: 'add_milestone', goal_id, title }) }),
    update: (id: number, status: string) => apiFetch<Goal>('/api/goals', { method: 'PUT', body: JSON.stringify({ id, status }) }),
    toggleMilestone: (id: number, completed: boolean) => apiFetch('/api/goals', { method: 'PUT', body: JSON.stringify({ action: 'toggle_milestone', id, completed }) }),
    updateMilestoneSubtasks: (id: number, subtasks: any[]) => apiFetch('/api/goals', { method: 'PUT', body: JSON.stringify({ action: 'update_milestone_subtasks', id, subtasks }) }),
    updateGoal: (id: number, data: Partial<Goal>) => apiFetch<Goal>('/api/goals', { method: 'PUT', body: JSON.stringify({ action: 'update_goal_details', id, ...data }) }),
    updateMilestone: (id: number, title: string) => apiFetch('/api/goals', { method: 'PUT', body: JSON.stringify({ action: 'update_milestone_title', id, title }) }),
    deleteGoal: (id: number) => apiFetch('/api/goals', { method: 'DELETE', body: JSON.stringify({ id }) }),
    deleteMilestone: (id: number) => apiFetch('/api/goals', { method: 'DELETE', body: JSON.stringify({ action: 'delete_milestone', id }) }),
  },
  availability: {
    list: (mentor_id: number, week?: string) => apiFetch<{ slots: AvailabilitySlot[]; bookedSessions: any[] }>(`/api/availability?mentor_id=${mentor_id}${week ? `&week=${week}` : ''}`),
    create: (data: Partial<AvailabilitySlot>) => apiFetch<AvailabilitySlot>('/api/availability', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: number) => apiFetch('/api/availability', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  admin: {
    stats: () => apiFetch<AdminStats>('/api/admin?action=stats'),
    pending: () => apiFetch<Profile[]>('/api/admin?action=pending'),
    audit: () => apiFetch<AuditLog[]>('/api/admin?action=audit'),
    reports: () => apiFetch<AdminReports>('/api/admin?action=reports'),
    allUsers: () => apiFetch<Profile[]>('/api/admin?action=all_users'),
    verify: (id: number, status: string) => apiFetch<Profile>('/api/admin?action=verify', { method: 'PUT', body: JSON.stringify({ id, verification_status: status }) }),
  },
  courses: {
    list: (category?: string) => apiFetch<Course[]>(`/api/courses${category ? `?category=${category}` : ''}`),
    myCourses: () => apiFetch<{ courses: Course[]; enrollments: Record<number, any> }>('/api/courses?enrolled=true'),
    get: (id: number) => apiFetch<Course>(`/api/courses?id=${id}`),
    create: (data: any) => apiFetch<Course>('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: number) => apiFetch<Course>('/api/courses?action=approve', { method: 'PUT', body: JSON.stringify({ id }) }),
    reject: (id: number) => apiFetch<Course>('/api/courses?action=reject', { method: 'PUT', body: JSON.stringify({ id }) }),
    update: (id: number, data: any) => apiFetch<Course>('/api/courses', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
    delete: (id: number) => apiFetch<{ success: boolean }>(`/api/courses?id=${id}`, { method: 'DELETE' }),
  },
  enrollments: {
    list: () => apiFetch<(Enrollment & { course?: Course })[]>('/api/enrollments'),
    enroll: (course_id: number) => apiFetch<Enrollment>('/api/enrollments', { method: 'POST', body: JSON.stringify({ course_id }) }),
    completeLesson: (enrollment_id: number, lesson_id: number) => apiFetch<Enrollment>('/api/enrollments', { method: 'PUT', body: JSON.stringify({ enrollment_id, lesson_id }) }),
    submitQuiz: (enrollment_id: number, quiz_id: number, score: number, passed: boolean) => apiFetch('/api/enrollments', { method: 'PUT', body: JSON.stringify({ enrollment_id, quiz_id, quiz_score: score, quiz_passed: passed }) }),
    getProgress: (enrollment_id: number) => apiFetch<{ lesson_id: number }[]>('/api/enrollments?progress=true&enrollment_id=' + enrollment_id),
    submitAssignment: (enrollment_id: number, lesson_id: number, text_content: string, file_url: string) => apiFetch<any>('/api/enrollments', { method: 'PUT', body: JSON.stringify({ enrollment_id, lesson_id, assignment_submit: true, text_content, file_url }) }),
    gradeAssignment: (enrollment_id: number, submission_id: number, score: number) => apiFetch<any>('/api/enrollments', { method: 'PUT', body: JSON.stringify({ enrollment_id, submission_id, grade_submit: true, score }) }),
    getCertificate: (course_id: number) => apiFetch<any>('/api/enrollments?certificate=true&course_id=' + course_id),
    getSubmissions: () => apiFetch<any[]>('/api/enrollments?submissions=true'),
  },
  blog: {
    list: (category?: string) => apiFetch<BlogPost[]>(`/api/blog${category ? `?category=${category}` : ''}`),
    get: (id: number) => apiFetch<BlogPost>(`/api/blog?id=${id}`),
    create: (data: any) => apiFetch<BlogPost>('/api/blog', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => apiFetch<BlogPost>('/api/blog', { method: 'PUT', body: JSON.stringify(data) }),
    submit: (id: number) => apiFetch<BlogPost>('/api/blog?action=submit', { method: 'PUT', body: JSON.stringify({ id }) }),
    approve: (id: number) => apiFetch<BlogPost>('/api/blog?action=approve', { method: 'PUT', body: JSON.stringify({ id }) }),
    reject: (id: number) => apiFetch<BlogPost>('/api/blog?action=reject', { method: 'PUT', body: JSON.stringify({ id }) }),
    delete: (id: number) => apiFetch<{ success: boolean }>(`/api/blog?id=${id}`, { method: 'DELETE' }),
  },
  comments: {
    list: (post_id: number) => apiFetch<BlogComment[]>(`/api/comments?post_id=${post_id}`),
    add: (post_id: number, content: string) => apiFetch<BlogComment>('/api/comments', { method: 'POST', body: JSON.stringify({ post_id, content }) }),
    moderate: (id: number, status: string) => apiFetch<BlogComment>('/api/comments', { method: 'PUT', body: JSON.stringify({ id, status }) }),
    remove: (id: number) => apiFetch('/api/comments', { method: 'DELETE', body: JSON.stringify({ id }) }),
    listForLesson: (lesson_id: number) => apiFetch<any[]>(`/api/comments?lesson_id=${lesson_id}`),
    addForLesson: (lesson_id: number, content: string) => apiFetch<any>('/api/comments', { method: 'POST', body: JSON.stringify({ lesson_id, content }) }),
  },
  library: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch<LibraryItem[]>(`/api/library${qs ? `?${qs}` : ''}`);
    },
    get: (id: number) => apiFetch<LibraryItem>(`/api/library?id=${id}`),
    create: (data: any) => apiFetch<LibraryItem>('/api/library', { method: 'POST', body: JSON.stringify(data) }),
    download: (id: number) => apiFetch<LibraryItem>('/api/library', { method: 'PUT', body: JSON.stringify({ id }) }),
    update: (id: number, data: any) => apiFetch<LibraryItem>('/api/library', { method: 'PUT', body: JSON.stringify({ id, action: 'edit', ...data }) }),
    delete: (id: number) => apiFetch<{ success: boolean }>(`/api/library?id=${id}`, { method: 'DELETE' }),
  },
  readingLists: {
    list: () => apiFetch<ReadingList[]>('/api/reading-lists'),
    get: (id: number) => apiFetch<ReadingList>(`/api/reading-lists?id=${id}`),
    create: (data: any) => apiFetch<ReadingList>('/api/reading-lists', { method: 'POST', body: JSON.stringify(data) }),
    addItem: (readingListId: number, bookId: number) =>
      apiFetch<any>('/api/reading-lists', { method: 'PUT', body: JSON.stringify({ action: 'add_item', reading_list_id: readingListId, book_id: bookId }) }),
    removeItem: (itemId: number) =>
      apiFetch<any>('/api/reading-lists', { method: 'PUT', body: JSON.stringify({ action: 'remove_item', id: itemId }) }),
  },
  events: {
    list: () => apiFetch<AppEvent[]>('/api/events'),
    get: (id: number) => apiFetch<AppEvent>(`/api/events?id=${id}`),
    create: (data: Partial<AppEvent>) => apiFetch<AppEvent>('/api/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, updates: Partial<AppEvent>) => apiFetch<AppEvent>('/api/events', { method: 'PUT', body: JSON.stringify({ id, ...updates }) }),
    delete: (id: number) => apiFetch('/api/events', { method: 'DELETE', body: JSON.stringify({ id }) }),
    rsvp: (eventId: number, rsvp: { guestName?: string; guestEmail?: string; status: 'attending' | 'interested' }) => 
      apiFetch<EventRegistration>('/api/events/register', { method: 'POST', body: JSON.stringify({ event_id: eventId, ...rsvp }) }),
    getRegistrations: (eventId: number) => apiFetch<EventRegistration[]>(`/api/events/register?event_id=${eventId}`),
  },
  announcements: {
    list: () => apiFetch<any[]>('/api/announcements'),
    create: (data: any) => apiFetch<any>('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
  },
  notifications: {
    list: () => apiFetch<any[]>('/api/notifications'),
    markRead: (id: string) => apiFetch<any>('/api/notifications', { method: 'PUT', body: JSON.stringify({ id, read: true }) }),
    remove: (id: string) => apiFetch('/api/notifications', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  stats: () => apiFetch<{ totalPersonnel: number; activeMatches: number; coursesCount: number; booksCount: number }>('/api/stats'),
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      const mockSessionStr = localStorage.getItem('mock_session');
      if (mockSessionStr) {
        try {
          const parsed = JSON.parse(mockSessionStr);
          token = parsed?.access_token || null;
        } catch (e) {}
      }
    }
    if (!token) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
      } catch (e) {}
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data as { url: string };
  },
};
