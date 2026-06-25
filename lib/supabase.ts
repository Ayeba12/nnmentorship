import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { MockDatabase } from '../domain/MockDatabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-build-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isOfflineMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder-build-url');

const mapMockIdToDbId = (mockId: string): number => {
  const mapping: Record<string, number> = {
    'user-admin-1': 1,
    'user-mentor-1': 2,
    'user-mentor-2': 3,
    'user-mentor-3': 4,
    'user-mentor-retired-1': 5,
    'user-mentor-retired-2': 6,
    'user-mentor-retired-pending': 6,
    'user-mentee-1': 7,
    'user-mentee-2': 8,
    'user-mentee-3': 9,
  };
  if (mapping[mockId]) return mapping[mockId];

  // Stable hash fallback for dynamically registered users
  let hash = 0;
  for (let i = 0; i < mockId.length; i++) {
    hash = mockId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 100000) + 1000;
};

const mapMockRoleToProfileRole = (mockRole: string): string => {
  if (mockRole === 'ADMIN') return 'admin';
  if (mockRole === 'MENTOR_ACTIVE') return 'active_mentor';
  if (mockRole === 'MENTOR_RETIRED') return 'retired_mentor';
  return 'mentee';
};

interface Filter {
  type: 'eq' | 'neq' | 'in' | 'gte';
  column: string;
  value: any;
}

class MockSupabaseQueryBuilder {
  private table: string;
  private insertData: any = null;
  private updateData: any = null;
  private isSingle = false;
  private filters: Filter[] = [];
  private limitCount: number | null = null;
  private orderBy: { column: string; ascending: boolean } | null = null;
  private orExpression: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select() { return this; }
  insert(data: any) {
    this.insertData = data;
    return this;
  }
  update(data: any) {
    this.updateData = data;
    return this;
  }
  delete() { return this; }
  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }
  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }
  in(column: string, value: any) {
    this.filters.push({ type: 'in', column, value });
    return this;
  }
  or(expr: string) {
    this.orExpression = expr;
    return this;
  }
  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }
  limit(value: number) {
    this.limitCount = value;
    return this;
  }
  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }
  range() { return this; }
  single() {
    this.isSingle = true;
    return this;
  }

  then(onfulfilled: any, onrejected?: any) {
    let data: any = [];

    MockDatabase.initialize();

    if (this.insertData) {
      const generatedId = Math.floor(Math.random() * 1000) + 100;
      const records = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      data = records.map(r => ({
        id: generatedId,
        created_at: new Date().toISOString(),
        ...r
      }));

      // Write to MockDatabase
      if (this.table === 'profiles') {
        const users = MockDatabase.getUsers();
        records.forEach(r => {
          let mappedRole: "MENTEE" | "MENTOR_ACTIVE" | "MENTOR_RETIRED" | "ADMIN" = 'MENTEE';
          if (r.role === 'admin') mappedRole = 'ADMIN';
          else if (r.role === 'active_mentor') mappedRole = 'MENTOR_ACTIVE';
          else if (r.role === 'retired_mentor') mappedRole = 'MENTOR_RETIRED';

          let mappedStatus: "PENDING" | "APPROVED" | "REJECTED" = 'PENDING';
          if (r.verification_status === 'verified') mappedStatus = 'APPROVED';
          else if (r.verification_status === 'rejected') mappedStatus = 'REJECTED';

          const newUser = {
            id: r.auth_id || `mock-uuid-${r.email}`,
            navyId: r.service_number || '',
            fullName: r.full_name || '',
            email: r.email || '',
            rank: r.rank || '',
            specialization: r.specialization || '',
            command: r.command_location || '',
            role: mappedRole,
            status: mappedStatus,
            bio: r.bio || '',
            availabilityScore: 8,
            historyScore: 8,
            isContentContributor: r.is_content_contributor || false,
            lastRankHeld: r.last_rank_held || undefined,
            yearsServed: r.years_served || undefined,
            yearsRetired: r.years_since_retirement || undefined,
            civilianRole: r.civilian_role || undefined,
            civilianIndustry: r.civilian_industry || undefined,
          };
          users.push(newUser);
        });
        MockDatabase.saveUsers(users);
      } else if (this.table === 'mentorship_requests' || this.table === 'mentorship_relationships') {
        const pairs = MockDatabase.getPairs();
        records.forEach(r => {
          const users = MockDatabase.getUsers();
          const menteeUser = users.find(u => mapMockIdToDbId(u.id) === r.mentee_id);
          const mentorUser = users.find(u => mapMockIdToDbId(u.id) === r.mentor_id);
          if (menteeUser && mentorUser) {
            pairs.push({
              id: `pair-${generatedId}`,
              menteeId: menteeUser.id,
              mentorId: mentorUser.id,
              matchScore: 90,
              status: r.status === 'accepted' || r.status === 'active' ? 'ACTIVE' : r.status === 'declined' || r.status === 'rejected' ? 'REJECTED' : 'PENDING',
              matchReason: r.message || 'New request',
              createdAt: new Date().toISOString()
            });
          }
        });
        MockDatabase.savePairs(pairs);
      } else if (this.table === 'sessions') {
        const sessions = MockDatabase.getSessions();
        records.forEach(r => {
          const pairs = MockDatabase.getPairs();
          const pair = pairs.find(p => (parseInt(p.id.replace(/\D/g, '')) || 1) === r.relationship_id);
          if (pair) {
            sessions.push({
              id: `session-${generatedId}`,
              pairId: pair.id,
              title: r.title,
              dateTime: r.scheduled_at,
              status: 'SCHEDULED',
              goalsAddressed: []
            });
          }
        });
        MockDatabase.saveSessions(sessions);
      } else if (this.table === 'goals') {
        const goals = MockDatabase.getGoals();
        records.forEach(r => {
          const pairs = MockDatabase.getPairs();
          const pair = pairs.find(p => (parseInt(p.id.replace(/\D/g, '')) || 1) === r.relationship_id);
          if (pair) {
            goals.push({
              id: `goal-${generatedId}`,
              pairId: pair.id,
              title: r.title,
              status: 'PENDING'
            });
          }
        });
        MockDatabase.saveGoals(goals);
      } else if (this.table === 'messages') {
        const messages = MockDatabase.getMessages();
        records.forEach(r => {
          const pairs = MockDatabase.getPairs();
          const pair = pairs.find(p => (parseInt(p.id.replace(/\D/g, '')) || 1) === r.relationship_id);
          if (pair) {
            const users = MockDatabase.getUsers();
            const sender = users.find(u => mapMockIdToDbId(u.id) === r.sender_id);
            messages.push({
              id: `msg-${generatedId}`,
              pairId: pair.id,
              senderId: sender ? sender.id : 'user-mentee-1',
              content: r.encrypted_content || '',
              timestamp: new Date().toISOString()
            });
          }
        });
        MockDatabase.saveMessages(messages);
      }

      if (this.isSingle || !Array.isArray(this.insertData)) {
        data = data[0];
      }
      return Promise.resolve({ data, count: 1, error: null }).then(onfulfilled, onrejected);
    }

    if (this.updateData) {
      let rawData: any[] = [];
      if (this.table === 'profiles') {
        rawData = MockDatabase.getUsers();
      } else if (this.table === 'mentorship_requests' || this.table === 'mentorship_relationships') {
        rawData = MockDatabase.getPairs();
      }

      const idFilter = this.filters.find(f => f.column === 'id');
      if (idFilter) {
        const dbId = idFilter.value;
        if (this.table === 'profiles') {
          const users = rawData as any[];
          const userToUpdate = users.find(u => mapMockIdToDbId(u.id) === dbId);
          if (userToUpdate) {
            if (this.updateData.verification_status) {
              const statusMap: Record<string, string> = {
                'verified': 'APPROVED',
                'pending': 'PENDING',
                'rejected': 'REJECTED'
              };
              userToUpdate.status = statusMap[this.updateData.verification_status] || 'APPROVED';
            }
            MockDatabase.updateUser(userToUpdate);
            data = [{
              id: mapMockIdToDbId(userToUpdate.id),
              email: userToUpdate.email,
              full_name: userToUpdate.fullName,
              role: mapMockRoleToProfileRole(userToUpdate.role),
              verification_status: userToUpdate.status === 'APPROVED' ? 'verified' : userToUpdate.status.toLowerCase() === 'pending' ? 'pending' : 'rejected',
              service_number: userToUpdate.navyId,
              specialization: userToUpdate.specialization,
              command_location: userToUpdate.command,
              bio: userToUpdate.bio,
              rank: userToUpdate.rank,
              is_content_contributor: userToUpdate.isContentContributor || false,
              is_accepting_mentees: true,
              max_mentees: 5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }];
          }
        } else if (this.table === 'mentorship_requests' || this.table === 'mentorship_relationships') {
          const pairs = rawData as any[];
          const pairToUpdate = pairs.find(p => (parseInt(p.id.replace(/\D/g, '')) || 1) === dbId);
          if (pairToUpdate) {
            if (this.updateData.status) {
              if (this.updateData.status === 'accepted') {
                pairToUpdate.status = 'ACTIVE';
              } else if (this.updateData.status === 'declined') {
                pairToUpdate.status = 'REJECTED';
              } else {
                pairToUpdate.status = this.updateData.status.toUpperCase();
              }
            }
            MockDatabase.savePairs(pairs);
            data = [{
              id: parseInt(pairToUpdate.id.replace(/\D/g, '')) || 1,
              mentee_id: mapMockIdToDbId(pairToUpdate.menteeId),
              mentor_id: mapMockIdToDbId(pairToUpdate.mentorId),
              status: pairToUpdate.status.toLowerCase(),
              started_at: pairToUpdate.createdAt,
            }];
          }
        }
      }

      if (this.isSingle) {
        data = data[0] || null;
      }
      return Promise.resolve({ data, count: Array.isArray(data) ? data.length : (data ? 1 : 0), error: null }).then(onfulfilled, onrejected);
    }

    if (this.table === 'profiles') {
      data = MockDatabase.getUsers().map(u => ({
        id: mapMockIdToDbId(u.id),
        email: u.email,
        full_name: u.fullName,
        role: mapMockRoleToProfileRole(u.role),
        verification_status: u.status ? (u.status === 'APPROVED' ? 'verified' : u.status.toLowerCase() === 'pending' ? 'pending' : 'rejected') : 'verified',
        service_number: u.navyId,
        specialization: u.specialization,
        command_location: u.command,
        bio: u.bio,
        rank: u.rank,
        is_content_contributor: u.isContentContributor || false,
        is_accepting_mentees: true,
        max_mentees: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } else if (this.table === 'mentorship_relationships') {
      data = MockDatabase.getPairs().map(p => ({
        id: parseInt(p.id.replace(/\D/g, '')) || 1,
        mentee_id: mapMockIdToDbId(p.menteeId),
        mentor_id: mapMockIdToDbId(p.mentorId),
        status: p.status.toLowerCase(),
        started_at: p.createdAt,
      }));
    } else if (this.table === 'mentorship_requests') {
      data = MockDatabase.getPairs().map(p => ({
        id: parseInt(p.id.replace(/\D/g, '')) || 1,
        mentee_id: mapMockIdToDbId(p.menteeId),
        mentor_id: mapMockIdToDbId(p.mentorId),
        request_type: 'mentee_choice',
        status: p.status === 'ACTIVE' || p.status === 'COMPLETED' ? 'accepted' : p.status === 'REJECTED' ? 'declined' : 'pending',
        message: p.matchReason || 'Request for mentorship alignment.',
        created_at: p.createdAt,
        responded_at: p.status !== 'PENDING' ? p.createdAt : null,
      }));
    } else if (this.table === 'sessions') {
      data = MockDatabase.getSessions().map(s => ({
        id: parseInt(s.id.replace(/\D/g, '')) || 1,
        relationship_id: parseInt(s.pairId.replace(/\D/g, '')) || 1,
        title: s.title,
        scheduled_at: s.dateTime,
        duration_minutes: 60,
        status: s.status.toLowerCase(),
        session_type: 'booked_slot',
        created_at: new Date().toISOString()
      }));
    } else if (this.table === 'goals') {
      data = MockDatabase.getGoals().map(g => ({
        id: parseInt(g.id.replace(/\D/g, '')) || 1,
        relationship_id: parseInt(g.pairId.replace(/\D/g, '')) || 1,
        title: g.title,
        description: '',
        status: g.status.toLowerCase(),
        created_at: new Date().toISOString()
      }));
    } else if (this.table === 'messages') {
      data = MockDatabase.getMessages().map(m => ({
        id: parseInt(m.id.replace(/\D/g, '')) || 1,
        relationship_id: parseInt(m.pairId.replace(/\D/g, '')) || 1,
        sender_id: mapMockIdToDbId(m.senderId),
        encrypted_content: m.content,
        iv: 'mock-iv',
        auth_tag: 'mock-tag',
        created_at: m.timestamp
      }));
    } else if (this.table === 'courses') {
      data = MockDatabase.getCourses().map(c => ({
        id: parseInt(c.id.replace(/\D/g, '')) || 1,
        title: c.title,
        description: c.description || '',
        category: 'Operations',
        difficulty: 'intermediate',
        status: c.status.toLowerCase() === 'approved' ? 'published' : 'pending',
        author_id: mapMockIdToDbId(c.instructorId),
        created_at: new Date().toISOString()
      }));
    } else if (this.table === 'library_items' || this.table === 'library') {
      data = MockDatabase.getLibraryBooks().map(b => ({
        id: parseInt(b.id.replace(/\D/g, '')) || 1,
        title: b.title,
        author: b.author,
        category: b.category,
        file_size: b.fileSize,
        format: 'pdf',
        status: b.status.toLowerCase() === 'approved' ? 'published' : 'pending',
        created_at: new Date().toISOString()
      }));
    } else if (this.table === 'audit_logs') {
      data = MockDatabase.getAuditLogs().map((l, index) => {
        let actor_id = null;
        if (l.performedBy === 'Admiral Ibrahim Ola') actor_id = 1;
        else if (l.performedBy === 'Captain Kelechi Amadi') actor_id = 2;
        else if (l.performedBy === 'Yusuf Musa') actor_id = 7;
        else if (l.performedBy === 'Fatima Bello') actor_id = 8;
        return {
          id: index + 1,
          action: l.action,
          actor_id,
          target_type: 'system',
          target_id: l.id,
          created_at: l.timestamp
        };
      });
    }

    // Apply orExpression filter
    if (this.orExpression) {
      const parts = this.orExpression.split(',');
      const parsedFilters = parts.map(part => {
        const [col, op, val] = part.split('.');
        let parsedVal: any = val;
        if (!isNaN(Number(val))) {
          parsedVal = Number(val);
        }
        return { col, op, val: parsedVal };
      });

      data = data.filter((item: any) => {
        return parsedFilters.some(pf => {
          if (pf.op === 'eq') {
            return item[pf.col] === pf.val;
          }
          return false;
        });
      });
    }

    // Apply standard filters
    for (const f of this.filters) {
      if (f.type === 'eq') {
        data = data.filter((row: any) => row[f.column] === f.value);
      } else if (f.type === 'neq') {
        data = data.filter((row: any) => row[f.column] !== f.value);
      } else if (f.type === 'in') {
        const vals = Array.isArray(f.value) ? f.value : [f.value];
        data = data.filter((row: any) => vals.includes(row[f.column]));
      } else if (f.type === 'gte') {
        data = data.filter((row: any) => row[f.column] >= f.value);
      }
    }

    // Apply order
    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      data = [...data].sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const comp = valA < valB ? -1 : 1;
        return ascending ? comp : -comp;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      data = data.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      data = data[0] || null;
    }

    return Promise.resolve({ data, count: Array.isArray(data) ? data.length : (data ? 1 : 0), error: null }).then(onfulfilled, onrejected);
  }
}

class MockSupabaseChannel {
  private name: string;
  private callbacks: any[] = [];

  constructor(name: string) {
    this.name = name;
  }

  on(event: string, filter: any, callback: any) {
    this.callbacks.push({ event, filter, callback });
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    if (callback) {
      setTimeout(() => callback('SUBSCRIBED'), 0);
    }
    return this;
  }
}

const mockSupabase = {
  from: (table: string) => new MockSupabaseQueryBuilder(table),
  channel: (name: string) => new MockSupabaseChannel(name),
  removeChannel: (channel: any) => {},
  auth: {
    getUser: async (token: string) => {
      const email = token.replace('mock-token-', '');
      return {
        data: {
          user: {
            id: `mock-uuid-${email}`,
            email: email,
            user_metadata: { full_name: email.split('@')[0] }
          }
        },
        error: null
      };
    },
    getSession: async () => {
      if (typeof window !== 'undefined') {
        const mockSessionStr = localStorage.getItem('mock_session');
        if (mockSessionStr) {
          try {
            return { data: { session: JSON.parse(mockSessionStr) }, error: null };
          } catch (e) {}
        }
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      if (typeof window !== 'undefined') {
        const mockSessionStr = localStorage.getItem('mock_session');
        if (mockSessionStr) {
          try {
            const session = JSON.parse(mockSessionStr);
            setTimeout(() => callback('SIGNED_IN', session), 0);
          } catch (e) {}
        }
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mock_session');
      }
      return { error: null };
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      const session = {
        access_token: `mock-token-${email}`,
        user: { email, id: `mock-uuid-${email}` }
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_session', JSON.stringify(session));
      }
      return {
        data: {
          user: {
            id: `mock-uuid-${email}`,
            email: email,
          },
          session
        },
        error: null
      };
    },
    signUp: async ({ email }: { email: string }) => {
      const session = {
        access_token: `mock-token-${email}`,
        user: { email, id: `mock-uuid-${email}` }
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_session', JSON.stringify(session));
      }
      return {
        data: {
          user: {
            id: `mock-uuid-${email}`,
            email: email,
          },
          session
        },
        error: null
      };
    }
  }
} as any;

const supabase: SupabaseClient = isOfflineMode ? (mockSupabase as any) : createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
