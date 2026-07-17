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

const getInitialMilestones = () => [
  {
    id: 1,
    goal_id: 1,
    title: "Review load balancing simulator guidelines",
    completed: true,
    completed_at: new Date().toISOString(),
    subtasks: [],
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    goal_id: 1,
    title: "Complete offline safety check walkthrough",
    completed: false,
    completed_at: null,
    subtasks: [],
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    goal_id: 2,
    title: "Submit engineering log to commanding officer",
    completed: true,
    completed_at: new Date().toISOString(),
    subtasks: [],
    created_at: new Date().toISOString()
  }
];

const getInitialEvents = () => [
  {
    id: 901,
    title: "Nigerian Navy Leadership Seminar 2026",
    description: "An offline physical event bringing together senior flag officers and junior officers to discuss maritime command leadership and navigation strategy.",
    event_type: "offline",
    visibility: "public",
    scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    duration_minutes: 120,
    location: "Naval Base Conference Hall, Apapa, Lagos",
    meeting_link: null,
    audio_url: null,
    external_link: null,
    created_by: 1
  },
  {
    id: 902,
    title: "Falcon Eye System Integration Workshop",
    description: "An online Zoom training session teaching officers how to integrate Falcon Eye domain awareness feeds into local patrol command software.",
    event_type: "online",
    visibility: "private",
    scheduled_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    duration_minutes: 90,
    location: null,
    meeting_link: "https://zoom.us/j/9876543210",
    audio_url: null,
    external_link: null,
    created_by: 1
  },
  {
    id: 903,
    title: "Naval Doctrine: Command at Sea Podcast",
    description: "A podcast event featuring an interview with retired Vice Admiral Cole on tactical decision-making under intense pressure in West African territorial waters.",
    event_type: "podcast",
    visibility: "public",
    scheduled_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    duration_minutes: 45,
    location: null,
    meeting_link: null,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    external_link: "https://spotify.com/podcast/naval-doctrine-command-at-sea",
    created_by: 1
  }
];

const getInitialDbCourses = () => [
  {
    id: 101,
    title: "Naval Leadership & Professional Ethics",
    description: "A comprehensive study of military leadership principles, moral ethics, and administrative responsibilities in the Nigerian Navy.",
    category: "Leadership",
    difficulty: "beginner",
    thumbnail_url: "/naval_command_ceremony.png",
    author_id: 4,
    status: "published",
    created_at: "2026-05-15T13:16:07.658Z"
  },
  {
    id: 102,
    title: "Maritime Security and Patrol Operations",
    description: "An overview of tactics, regulations, and operational guidelines for combating piracy, oil theft, and illegal fishing in Nigerian territorial waters.",
    category: "Operations",
    difficulty: "intermediate",
    thumbnail_url: "/naval_fleet_operations.png",
    author_id: 4,
    status: "published",
    created_at: "2026-06-04T13:16:07.658Z"
  },
  {
    id: 103,
    title: "Special Naval Warfare & SBS Tactics",
    description: "Operational protocols and tactical insertion strategies for the Special Boat Service (SBS), including maritime counter-terrorism.",
    category: "Combat Systems",
    difficulty: "advanced",
    thumbnail_url: "/naval_training_drill.png",
    author_id: 3,
    status: "published",
    created_at: "2026-06-25T13:16:07.658Z"
  },
  {
    id: 104,
    title: "Naval Communications & Signal Encryption",
    description: "Advanced radio wave propagation, military satellite communication, and secure signal encryption key distribution protocols.",
    category: "Combat Systems",
    difficulty: "advanced",
    thumbnail_url: null,
    author_id: 3,
    status: "published",
    created_at: "2026-06-26T13:16:07.658Z"
  },
  {
    id: 105,
    title: "Oceanography & Marine Meteorology",
    description: "Study of ocean currents, wave heights, and weather forecasting methodologies for planning safe sea maneuvers and naval landing operations.",
    category: "Navigation",
    difficulty: "intermediate",
    thumbnail_url: null,
    author_id: 2,
    status: "published",
    created_at: "2026-06-27T13:16:07.658Z"
  },
  {
    id: 106,
    title: "Marine Gas Turbine Engines & Maintenance",
    description: "Technical instruction on operational cycles, compressor wash procedures, and fuel nozzle calibrations for shipboard LM2500 gas turbines.",
    category: "Engineering",
    difficulty: "advanced",
    thumbnail_url: null,
    author_id: 2,
    status: "published",
    created_at: "2026-06-28T13:16:07.658Z"
  },
  {
    id: 107,
    title: "Officer of the Watch (OOW) Watchkeeping & Seamanship",
    description: "Essential training module covering radar plotting, collision avoidance regulations (COLREGs), and bridge deck team management.",
    category: "Navigation",
    difficulty: "beginner",
    thumbnail_url: "/naval_fleet_operations.png",
    author_id: 4,
    status: "published",
    created_at: "2026-05-15T13:16:07.658Z"
  },
  {
    id: 108,
    title: "Afloat Diesel Propulsion Operations & Auxiliary Diagnostics",
    description: "Deep dive study for marine engineering officers on maintaining MTU auxiliary power generators, diesel combustion logs, and gearbox refits.",
    category: "Engineering",
    difficulty: "intermediate",
    thumbnail_url: null,
    author_id: 2,
    status: "published",
    created_at: "2026-06-04T13:16:07.658Z"
  },
  {
    id: 109,
    title: "Maritime Boundary Law & EEZ Patrol Strategy",
    description: "Legal and tactical frameworks for patrolling Nigeria's Exclusive Economic Zone, prosecuting illegal fishing, and implementing Gulf of Guinea security accords.",
    category: "Operations",
    difficulty: "intermediate",
    thumbnail_url: "/naval_training_drill.png",
    author_id: 5,
    status: "published",
    created_at: "2026-06-09T13:16:07.658Z"
  },
  {
    id: 110,
    title: "Combat Systems Alignment & Electronic Warfare",
    description: "Technical manuals on radar calibration, fire control systems, and jamming countermeasures for electrical engineering officers.",
    category: "Combat Systems",
    difficulty: "advanced",
    thumbnail_url: null,
    author_id: 3,
    status: "published",
    created_at: "2026-06-12T13:16:07.658Z"
  },
  {
    id: 111,
    title: "Naval Logistics, Supply Chain & Fleet Sustainment",
    description: "Detailed training on replenishment at sea, dockyard procurement, and spare parts cataloging for logistics officers.",
    category: "Logistics",
    difficulty: "intermediate",
    thumbnail_url: null,
    author_id: 5,
    status: "published",
    created_at: "2026-06-14T13:16:07.658Z"
  },
  {
    id: 112,
    title: "Hydrographic Surveying & Sea Charting Protocols",
    description: "Advanced course on sonar bathymetry, tidal corrections, and compiling official charts for the Nigerian Navy Hydrographic Office.",
    category: "Navigation",
    difficulty: "advanced",
    thumbnail_url: null,
    author_id: 2,
    status: "published",
    created_at: "2026-06-16T13:16:07.658Z"
  },
  {
    id: 113,
    title: "Naval Command Leadership & Administrative Doctrine",
    description: "Officer-level training covering staff writing, operational briefing structures, military justice procedures, and command ethics.",
    category: "Leadership",
    difficulty: "intermediate",
    thumbnail_url: "/naval_mentorship_session.png",
    author_id: 4,
    status: "published",
    created_at: "2026-06-19T13:16:07.658Z"
  },
  {
    id: 114,
    title: "Search and Rescue (SAR) Mission Coordination",
    description: "Tactical procedures for search pattern planning, communications with maritime rescue coordination centers, and rescue helicopter operations.",
    category: "Operations",
    difficulty: "intermediate",
    thumbnail_url: null,
    author_id: 4,
    status: "published",
    created_at: "2026-06-22T13:16:07.658Z"
  },
  {
    id: 115,
    title: "Naval Intelligence Gathering & Reconnaissance Strategies",
    description: "Detailed seminar outlining signal intelligence parsing, radar interception logs, and littoral zone intelligence networks.",
    category: "Operations",
    difficulty: "advanced",
    thumbnail_url: null,
    author_id: 6,
    status: "pending",
    created_at: "2026-06-24T13:16:07.658Z"
  }
];

const getInitialDbLessons = () => [
  {
    id: 201,
    course_id: 101,
    title: 'Core Values of the Nigerian Navy',
    content: 'The Nigerian Navy core values are Honor, Commitment, and Patriotism. These pillars guide every decision and action, both in maritime operations and administrative duties. Understanding these core tenets is crucial for all junior officers and ratings. Officers must embody integrity, lead by example, and maintain high standards of discipline at all times.',
    video_url: null,
    duration_minutes: 15,
    order_index: 1
  },
  {
    id: 202,
    course_id: 101,
    title: 'The Chain of Command and Reporting',
    content: 'Military order relies entirely on the chain of command. In this lesson, we examine the structural hierarchy of the Nigerian Navy, how messages are transmitted up and down the chain, and the protocol for submitting reports. We will also cover professional courtesy and the significance of respect for seniority.',
    video_url: null,
    duration_minutes: 20,
    order_index: 2
  },
  {
    id: 203,
    course_id: 102,
    title: 'Anti-Piracy Procedures',
    content: 'Combating piracy requires coordinated surveillance, rapid boarding tactics, and adherence to international maritime law. This lesson details standard patrol routes, communication encryption, and response rules of engagement when intercepting suspicious vessels.',
    video_url: null,
    duration_minutes: 25,
    order_index: 1
  }
];

const getInitialDbBlogPosts = () => [
  {
    id: 501,
    title: 'Securing the Gulf of Guinea: Modern Anti-Piracy Operations',
    slug: 'securing-the-gulf-of-guinea',
    excerpt: 'An analysis of contemporary maritime threats in West African waters and the strategic responses implemented by the Nigerian Navy.',
    content: 'The Gulf of Guinea has historically been a critical maritime transit corridor, yet it remains one of the world\'s most challenging regions for piracy and armed robbery at sea. In recent years, the Nigerian Navy has restructured its patrol strategies, deploying state-of-the-art offshore patrol vessels (OPVs), implementing the Falcon Eye maritime domain awareness system, and strengthening regional collaborations.\n\nKey to these successes has been the integration of air assets, naval intelligence, and fast interception boats. Junior officers must understand the geopolitical importance of secure sea lines of communication (SLOC) and the tactical procedures of Boarding, Search, and Seizure (VBSS) operations.',
    category: 'Operations',
    tags: 'Piracy, Gulf of Guinea, Patrol',
    cover_image: null,
    author_id: 2,
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 502,
    title: 'Navigating Career Progression as a Naval Officer',
    slug: 'navigating-career-progression',
    excerpt: 'Guidance and leadership insights for junior officers on promotions, staff courses, and specialization pathways.',
    content: 'A career in the Nigerian Navy is both highly rewarding and demanding. Progression from Sub-Lieutenant to Captain requires more than just years of service—it requires continuous professional military education, outstanding performance in command and staff appointments, and personal integrity.\n\nThis article outlines the milestones: completing the Junior Staff Course, choosing specialization branches (such as Navigation, Weapons Engineering, Hydrography, or Logistics), and the critical role that mentorship plays in helping you navigate these vital transitions.',
    category: 'Career Advice',
    tags: 'Promotion, Career, Specialization',
    cover_image: null,
    author_id: 1,
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];

const getInitialDbLibraryItems = () => [
  {
    id: 701,
    title: 'Nigerian Navy Doctrine (NND 2024)',
    description: 'The official doctrine document outlining the strategic operations, maritime strategy, and command guidelines of the Nigerian Navy.',
    category: 'Regulations',
    format: 'pdf',
    file_url: null,
    external_link: 'https://example.com/navy-doctrine-2024.pdf',
    author: 'Naval Headquarters',
    rank_level: 'All',
    uploaded_by: 1,
    downloads_count: 142,
    created_at: new Date().toISOString()
  },
  {
    id: 702,
    title: 'Manual of Naval Correspondence',
    description: 'A guidelines manual details style, formatting, and protocols for official letters, memos, signals, and naval communications.',
    category: 'Administration',
    format: 'document',
    file_url: null,
    external_link: 'https://example.com/navy-correspondence-manual.docx',
    author: 'Naval Secretary Directorate',
    rank_level: 'All',
    uploaded_by: 1,
    downloads_count: 89,
    created_at: new Date().toISOString()
  },
  {
    id: 703,
    title: 'Basic Seamanship and General Navigation',
    description: 'An educational handbook covering anchor work, ship handling, mooring, basic celestial navigation, and nautical terms.',
    category: 'Seamanship',
    format: 'pdf',
    file_url: null,
    external_link: 'https://example.com/basic-seamanship.pdf',
    author: 'Nigerian Naval College',
    rank_level: 'Junior Officer / Rating',
    uploaded_by: 2,
    downloads_count: 213,
    created_at: new Date().toISOString()
  }
];

const loadMockTable = (table: string, defaultData: any[] = []): any[] => {
  if (typeof window !== 'undefined') {
    const dataStr = localStorage.getItem(`nn_${table}`);
    if (dataStr) return JSON.parse(dataStr);
    localStorage.setItem(`nn_${table}`, JSON.stringify(defaultData));
    return defaultData;
  } else {
    try {
      const fs = require('fs');
      const path = require('path');
      const dbDir = path.join(process.cwd(), 'db');
      if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
      const filePath = path.join(dbDir, `mock_db_${table}.json`);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    } catch (e) {
      console.error(`loadMockTable error for ${table}:`, e);
      return defaultData;
    }
  }
};

const saveMockTable = (table: string, data: any[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`nn_${table}`, JSON.stringify(data));
  } else {
    try {
      const fs = require('fs');
      const path = require('path');
      const dbDir = path.join(process.cwd(), 'db');
      if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
      const filePath = path.join(dbDir, `mock_db_${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error(`saveMockTable error for ${table}:`, e);
    }
  }
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
  private isDelete = false;
  private isSingle = false;
  private isMaybeSingle = false;
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
  delete() {
    this.isDelete = true;
    return this;
  }
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
  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  then(onfulfilled: any, onrejected?: any) {
    let data: any = [];

    MockDatabase.initialize();

    if (this.isDelete) {
      const idFilter = this.filters.find(f => f.type === 'eq' && f.column === 'id');
      const dbId = idFilter ? Number(idFilter.value) : null;
      if (dbId) {
        if (this.table === 'events') {
          if (typeof window !== 'undefined') {
            const evStr = localStorage.getItem('nn_events');
            if (evStr) {
              const current = JSON.parse(evStr);
              const filtered = current.filter((e: any) => e.id !== dbId);
              localStorage.setItem('nn_events', JSON.stringify(filtered));
            }
          } else {
            try {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(process.cwd(), 'db', 'mock_db_events.json');
              if (fs.existsSync(filePath)) {
                const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const filtered = current.filter((e: any) => e.id !== dbId);
                fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
              }
            } catch (e) {
              console.error('Server delete event error:', e);
            }
          }
        } else if (this.table === 'event_registrations') {
          if (typeof window !== 'undefined') {
            const regStr = localStorage.getItem('nn_event_registrations');
            if (regStr) {
              const current = JSON.parse(regStr);
              const filtered = current.filter((r: any) => r.id !== dbId);
              localStorage.setItem('nn_event_registrations', JSON.stringify(filtered));
            }
          } else {
            try {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(process.cwd(), 'db', 'mock_db_event_registrations.json');
              if (fs.existsSync(filePath)) {
                const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const filtered = current.filter((r: any) => r.id !== dbId);
                fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
              }
            } catch (e) {
              console.error('Server delete registration error:', e);
            }
          }
        } else if (this.table === 'notifications') {
          const notifications = MockDatabase.getNotifications();
          const targetId = idFilter ? String(idFilter.value) : '';
          const filtered = notifications.filter(n => n.id !== targetId);
          MockDatabase.saveNotifications(filtered);
        } else if (this.table === 'goals') {
          const goals = MockDatabase.getGoals();
          const targetId = idFilter ? String(idFilter.value) : '';
          const filtered = goals.filter(g => g.id !== targetId && g.id !== `goal-${targetId}` && (parseInt(g.id.replace(/\D/g, '')) || 0) !== Number(targetId));
          MockDatabase.saveGoals(filtered);
        } else if (this.table === 'milestones') {
          if (typeof window !== 'undefined') {
            const msStr = localStorage.getItem('nn_milestones');
            if (msStr) {
              const current = JSON.parse(msStr);
              const filtered = current.filter((m: any) => Number(m.id) !== Number(dbId));
              localStorage.setItem('nn_milestones', JSON.stringify(filtered));
            }
          } else {
            try {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(process.cwd(), 'db', 'mock_db_milestones.json');
              if (fs.existsSync(filePath)) {
                const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const filtered = current.filter((m: any) => Number(m.id) !== Number(dbId));
                fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
              }
            } catch (e) {
              console.error('Server delete milestone error:', e);
            }
          }
        } else if (this.table === 'courses') {
          const current = loadMockTable('courses', getInitialDbCourses());
          const filtered = current.filter((c: any) => Number(c.id) !== Number(dbId));
          saveMockTable('courses', filtered);
        } else if (this.table === 'lessons') {
          const current = loadMockTable('lessons', getInitialDbLessons());
          const courseIdFilter = this.filters.find(f => f.column === 'course_id');
          if (courseIdFilter) {
            const cid = Number(courseIdFilter.value);
            const filtered = current.filter((l: any) => Number(l.course_id) !== cid);
            saveMockTable('lessons', filtered);
          } else {
            const filtered = current.filter((l: any) => Number(l.id) !== Number(dbId));
            saveMockTable('lessons', filtered);
          }
        } else if (this.table === 'blog_posts') {
          const current = loadMockTable('blogposts', getInitialDbBlogPosts());
          const filtered = current.filter((p: any) => Number(p.id) !== Number(dbId));
          saveMockTable('blogposts', filtered);
        } else if (this.table === 'library_items' || this.table === 'library') {
          const current = loadMockTable('library', getInitialDbLibraryItems());
          const filtered = current.filter((b: any) => Number(b.id) !== Number(dbId));
          saveMockTable('library', filtered);
        }
      }
      return Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected);
    }

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
              title: r.title || (r.session_type === 'proposed_time' ? 'Proposed Mentorship Session' : 'Scheduled Mentorship Session'),
              dateTime: r.scheduled_at,
              status: (r.status || 'scheduled').toUpperCase(),
              goalsAddressed: [],
              notes: r.notes || null,
              goals_set: r.goals_set || null,
              progress_recorded: r.progress_recorded || null,
              duration_minutes: r.duration_minutes || 60,
              session_type: r.session_type || 'booked_slot',
              completed_at: r.completed_at || null,
            } as any);
          }
        });
        MockDatabase.saveSessions(sessions);
      } else if (this.table === 'goals') {
        const goals = MockDatabase.getGoals();
        const users = MockDatabase.getUsers();
        records.forEach(r => {
          const pairs = MockDatabase.getPairs();
          const pair = r.relationship_id ? pairs.find(p => (parseInt(p.id.replace(/\D/g, '')) || 1) === r.relationship_id) : null;
          const menteeUser = users.find(u => mapMockIdToDbId(u.id) === Number(r.mentee_id));
          const mentorUser = users.find(u => mapMockIdToDbId(u.id) === Number(r.mentor_id));
          goals.push({
            id: `goal-${generatedId}`,
            pairId: pair ? pair.id : '',
            title: r.title,
            status: 'PENDING',
            menteeId: menteeUser ? menteeUser.id : (pair ? pair.menteeId : ''),
            mentorId: mentorUser ? mentorUser.id : (pair ? pair.mentorId : '')
          });
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
      } else if (this.table === 'milestones') {
        if (typeof window !== 'undefined') {
          const msStr = localStorage.getItem('nn_milestones');
          const current = msStr ? JSON.parse(msStr) : [];
          records.forEach(r => {
            current.push({
              id: generatedId,
              created_at: new Date().toISOString(),
              completed: false,
              completed_at: null,
              subtasks: [],
              ...r
            });
          });
          localStorage.setItem('nn_milestones', JSON.stringify(current));
        } else {
          try {
            const fs = require('fs');
            const path = require('path');
            const dbDir = path.join(process.cwd(), 'db');
            if (!fs.existsSync(dbDir)) {
              fs.mkdirSync(dbDir);
            }
            const filePath = path.join(dbDir, 'mock_db_milestones.json');
            let current = [];
            if (fs.existsSync(filePath)) {
              current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } else {
              current = getInitialMilestones();
            }
            records.forEach(r => {
              current.push({
                id: generatedId,
                created_at: new Date().toISOString(),
                completed: false,
                completed_at: null,
                subtasks: [],
                ...r
              });
            });
            fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
          } catch (e) {
            console.error('Server save milestones error:', e);
          }
        }
      } else if (this.table === 'events') {
        if (typeof window !== 'undefined') {
          const evStr = localStorage.getItem('nn_events');
          const current = evStr ? JSON.parse(evStr) : [];
          records.forEach(r => {
            current.push({
              id: generatedId,
              created_at: new Date().toISOString(),
              duration_minutes: 60,
              visibility: 'public',
              location: null,
              meeting_link: null,
              audio_url: null,
              external_link: null,
              ...r
            });
          });
          localStorage.setItem('nn_events', JSON.stringify(current));
        } else {
          try {
            const fs = require('fs');
            const path = require('path');
            const dbDir = path.join(process.cwd(), 'db');
            if (!fs.existsSync(dbDir)) {
              fs.mkdirSync(dbDir);
            }
            const filePath = path.join(dbDir, 'mock_db_events.json');
            let current = [];
            if (fs.existsSync(filePath)) {
              current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } else {
              current = getInitialEvents();
            }
            records.forEach(r => {
              current.push({
                id: generatedId,
                created_at: new Date().toISOString(),
                duration_minutes: 60,
                visibility: 'public',
                location: null,
                meeting_link: null,
                audio_url: null,
                external_link: null,
                ...r
              });
            });
            fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
          } catch (e) {
            console.error('Server save events error:', e);
          }
        }
      } else if (this.table === 'event_registrations') {
        if (typeof window !== 'undefined') {
          const regStr = localStorage.getItem('nn_event_registrations');
          const current = regStr ? JSON.parse(regStr) : [];
          records.forEach(r => {
            current.push({
              id: generatedId,
              created_at: new Date().toISOString(),
              guest_name: null,
              guest_email: null,
              user_id: null,
              ...r
            });
          });
          localStorage.setItem('nn_event_registrations', JSON.stringify(current));
        } else {
          try {
            const fs = require('fs');
            const path = require('path');
            const dbDir = path.join(process.cwd(), 'db');
            if (!fs.existsSync(dbDir)) {
              fs.mkdirSync(dbDir);
            }
            const filePath = path.join(dbDir, 'mock_db_event_registrations.json');
            let current = [];
            if (fs.existsSync(filePath)) {
              current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            records.forEach(r => {
              current.push({
                id: generatedId,
                created_at: new Date().toISOString(),
                guest_name: null,
                guest_email: null,
                user_id: null,
                ...r
              });
            });
            fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
          } catch (e) {
            console.error('Server save registrations error:', e);
          }
        }
      } else if (this.table === 'announcements') {
        records.forEach(r => {
          MockDatabase.createAnnouncement(
            r.title,
            r.content,
            r.target_role?.toUpperCase() || 'ALL',
            r.sender_name || 'System'
          );
        });
      } else if (this.table === 'notifications') {
        records.forEach(r => {
          const users = MockDatabase.getUsers();
          const targetUser = users.find(u => mapMockIdToDbId(u.id) === Number(r.user_id));
          if (targetUser) {
            MockDatabase.createNotification(
              targetUser.id,
              r.type || 'system',
              r.title,
              r.message,
              r.link || '/dashboard'
            );
          }
        });
      } else if (this.table === 'courses') {
        const current = loadMockTable('courses', getInitialDbCourses());
        records.forEach(r => {
          current.push({
            id: generatedId,
            status: 'pending',
            created_at: new Date().toISOString(),
            ...r
          });
        });
        saveMockTable('courses', current);
      } else if (this.table === 'lessons') {
        const current = loadMockTable('lessons', getInitialDbLessons());
        records.forEach(r => {
          current.push({
            id: generatedId,
            ...r
          });
        });
        saveMockTable('lessons', current);
      } else if (this.table === 'blog_posts') {
        const current = loadMockTable('blogposts', getInitialDbBlogPosts());
        records.forEach(r => {
          current.push({
            id: generatedId,
            status: 'draft',
            created_at: new Date().toISOString(),
            ...r
          });
        });
        saveMockTable('blogposts', current);
      } else if (this.table === 'library_items' || this.table === 'library') {
        const current = loadMockTable('library', getInitialDbLibraryItems());
        records.forEach(r => {
          current.push({
            id: generatedId,
            downloads_count: 0,
            created_at: new Date().toISOString(),
            ...r
          });
        });
        saveMockTable('library', current);
      } else if (this.table === 'enrollments') {
        const current = loadMockTable('enrollments', []);
        records.forEach(r => {
          current.push({
            id: generatedId,
            enrolled_at: new Date().toISOString(),
            status: 'in_progress',
            progress: 0,
            ...r
          });
        });
        saveMockTable('enrollments', current);
        data = records.map(r => ({ id: generatedId, enrolled_at: new Date().toISOString(), status: 'in_progress', progress: 0, ...r }));
      } else if (this.table === 'lesson_progress') {
        const current = loadMockTable('lesson_progress', []);
        records.forEach(r => {
          current.push({
            id: generatedId,
            created_at: new Date().toISOString(),
            ...r
          });
        });
        saveMockTable('lesson_progress', current);
        data = records.map(r => ({ id: generatedId, created_at: new Date().toISOString(), ...r }));
      } else if (this.table === 'quiz_attempts') {
        const current = loadMockTable('quiz_attempts', []);
        records.forEach(r => {
          current.push({
            id: generatedId,
            submitted_at: new Date().toISOString(),
            ...r
          });
        });
        saveMockTable('quiz_attempts', current);
        data = records.map(r => ({ id: generatedId, submitted_at: new Date().toISOString(), ...r }));
      } else if (this.table === 'assignments') {
        const current = loadMockTable('assignments', []);
        records.forEach(r => {
          current.push({
            id: generatedId,
            created_at: new Date().toISOString(),
            ...r
          });
        });
        saveMockTable('assignments', current);
        data = records.map(r => ({ id: generatedId, created_at: new Date().toISOString(), ...r }));
      } else if (this.table === 'assignment_submissions') {
        const current = loadMockTable('assignment_submissions', []);
        records.forEach(r => {
          current.push({
            id: generatedId,
            submitted_at: new Date().toISOString(),
            status: 'pending',
            ...r
          });
        });
        saveMockTable('assignment_submissions', current);
        data = records.map(r => ({ id: generatedId, submitted_at: new Date().toISOString(), status: 'pending', ...r }));
      } else if (this.table === 'lesson_comments') {
        const current = loadMockTable('lesson_comments', []);
        records.forEach(r => {
          current.push({
            id: generatedId,
            created_at: new Date().toISOString(),
            ...r
          });
        });
        saveMockTable('lesson_comments', current);
        data = records.map(r => ({ id: generatedId, created_at: new Date().toISOString(), ...r }));
      } else if (this.table === 'certificates') {
        const current = loadMockTable('certificates', []);
        records.forEach(r => {
          current.push({
            id: generatedId,
            issued_at: new Date().toISOString(),
            ...r
          });
        });
        saveMockTable('certificates', current);
        data = records.map(r => ({ id: generatedId, issued_at: new Date().toISOString(), ...r }));
      }

      if (this.isMaybeSingle) {
        data = data[0] || null;
      } else if (this.isSingle || !Array.isArray(this.insertData)) {
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
            if (this.updateData.full_name !== undefined) userToUpdate.fullName = this.updateData.full_name;
            if (this.updateData.specialization !== undefined) userToUpdate.specialization = this.updateData.specialization;
            if (this.updateData.command_location !== undefined) userToUpdate.command = this.updateData.command_location;
            if (this.updateData.bio !== undefined) userToUpdate.bio = this.updateData.bio;
            if (this.updateData.rank !== undefined) userToUpdate.rank = this.updateData.rank;
            if (this.updateData.is_content_contributor !== undefined) userToUpdate.isContentContributor = this.updateData.is_content_contributor;
            if (this.updateData.last_rank_held !== undefined) userToUpdate.lastRankHeld = this.updateData.last_rank_held;
            if (this.updateData.years_served !== undefined) userToUpdate.yearsServed = this.updateData.years_served;
            if (this.updateData.years_since_retirement !== undefined) userToUpdate.yearsRetired = this.updateData.years_since_retirement;
            if (this.updateData.civilian_role !== undefined) userToUpdate.civilianRole = this.updateData.civilian_role;
            if (this.updateData.civilian_industry !== undefined) userToUpdate.civilianIndustry = this.updateData.civilian_industry;
            if (this.updateData.service_number !== undefined) userToUpdate.navyId = this.updateData.service_number;
            if (this.updateData.is_accepting_mentees !== undefined) userToUpdate.is_accepting_mentees = this.updateData.is_accepting_mentees;
            if (this.updateData.max_mentees !== undefined) userToUpdate.max_mentees = this.updateData.max_mentees;
            if (this.updateData.service_branch !== undefined) userToUpdate.service_branch = this.updateData.service_branch;
            if (this.updateData.years_of_service !== undefined) userToUpdate.years_of_service = this.updateData.years_of_service;
            if (this.updateData.career_goals !== undefined) userToUpdate.career_goals = this.updateData.career_goals;
            if (this.updateData.mentorship_interests !== undefined) userToUpdate.mentorship_interests = this.updateData.mentorship_interests;
            if (this.updateData.avatar_url !== undefined) userToUpdate.avatar_url = this.updateData.avatar_url;
            if (this.updateData.additional_pictures !== undefined) userToUpdate.additional_pictures = this.updateData.additional_pictures;
            if (this.updateData.can_manage_blog !== undefined) userToUpdate.can_manage_blog = this.updateData.can_manage_blog;
            if (this.updateData.can_manage_courses !== undefined) userToUpdate.can_manage_courses = this.updateData.can_manage_courses;
            if (this.updateData.can_manage_library !== undefined) userToUpdate.can_manage_library = this.updateData.can_manage_library;

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
              is_accepting_mentees: userToUpdate.is_accepting_mentees !== undefined ? userToUpdate.is_accepting_mentees : true,
              max_mentees: userToUpdate.max_mentees || 5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_rank_held: userToUpdate.lastRankHeld || null,
              years_served: userToUpdate.yearsServed || null,
              years_since_retirement: userToUpdate.yearsRetired || null,
              civilian_role: userToUpdate.civilianRole || null,
              civilian_industry: userToUpdate.civilianIndustry || null,
              service_branch: userToUpdate.service_branch || userToUpdate.command?.split(' ')[0] || 'Operations',
              years_of_service: userToUpdate.years_of_service !== undefined ? userToUpdate.years_of_service : 10,
              career_goals: userToUpdate.career_goals || '',
              mentorship_interests: userToUpdate.mentorship_interests || '',
              avatar_url: userToUpdate.avatar_url || null,
              additional_pictures: userToUpdate.additional_pictures || null,
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

        } else if (this.table === 'events') {
          if (typeof window !== 'undefined') {
            const evStr = localStorage.getItem('nn_events');
            const current = evStr ? JSON.parse(evStr) : [];
            const index = current.findIndex((e: any) => Number(e.id) === Number(dbId));
            if (index !== -1) {
              current[index] = {
                ...current[index],
                ...this.updateData
              };
              localStorage.setItem('nn_events', JSON.stringify(current));
              data = [current[index]];
            }
          } else {
            try {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(process.cwd(), 'db', 'mock_db_events.json');
              if (fs.existsSync(filePath)) {
                const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const index = current.findIndex((e: any) => Number(e.id) === Number(dbId));
                if (index !== -1) {
                  current[index] = {
                    ...current[index],
                    ...this.updateData
                  };
                  fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
                  data = [current[index]];
                }
              }
            } catch (e) {
              console.error('Server update event error:', e);
            }
          }
        } else if (this.table === 'event_registrations') {
          if (typeof window !== 'undefined') {
            const regStr = localStorage.getItem('nn_event_registrations');
            const current = regStr ? JSON.parse(regStr) : [];
            const index = current.findIndex((reg: any) => Number(reg.id) === Number(dbId));
            if (index !== -1) {
              current[index] = {
                ...current[index],
                ...this.updateData
              };
              localStorage.setItem('nn_event_registrations', JSON.stringify(current));
              data = [current[index]];
            }
          } else {
            try {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(process.cwd(), 'db', 'mock_db_event_registrations.json');
              if (fs.existsSync(filePath)) {
                const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const index = current.findIndex((reg: any) => Number(reg.id) === Number(dbId));
                if (index !== -1) {
                  current[index] = {
                    ...current[index],
                    ...this.updateData
                  };
                  fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
                  data = [current[index]];
                }
              }
            } catch (e) {
              console.error('Server update registration error:', e);
            }
          }
        } else if (this.table === 'notifications') {
          const notifications = MockDatabase.getNotifications();
          const notifToUpdate = notifications.find(n => n.id === dbId || n.id === String(dbId));
          if (notifToUpdate) {
            if (this.updateData.read !== undefined) notifToUpdate.read = this.updateData.read;
            MockDatabase.saveNotifications(notifications);
            data = [{
              id: notifToUpdate.id,
              user_id: mapMockIdToDbId(notifToUpdate.userId),
              type: notifToUpdate.type,
              title: notifToUpdate.title,
              message: notifToUpdate.message,
              time: notifToUpdate.time,
              read: notifToUpdate.read,
              link: notifToUpdate.link
            }];
          }
        } else if (this.table === 'goals') {
          const goals = MockDatabase.getGoals();
          const goalToUpdate = goals.find(g => g.id === dbId || g.id === `goal-${dbId}` || (parseInt(g.id.replace(/\D/g, '')) || 0) === Number(dbId));
          if (goalToUpdate) {
            if (this.updateData.status !== undefined) {
              const statusMap: Record<string, "PENDING" | "IN_PROGRESS" | "COMPLETED"> = {
                'active': 'IN_PROGRESS',
                'completed': 'COMPLETED',
                'pending': 'PENDING'
              };
              goalToUpdate.status = statusMap[this.updateData.status] || 'IN_PROGRESS';
            }
            if (this.updateData.title !== undefined) goalToUpdate.title = this.updateData.title;
            MockDatabase.saveGoals(goals);
            data = [{
              id: parseInt(goalToUpdate.id.replace(/\D/g, '')) || 1,
              relationship_id: goalToUpdate.pairId ? (parseInt(goalToUpdate.pairId.replace(/\D/g, '')) || null) : null,
              title: goalToUpdate.title,
              description: '',
              status: goalToUpdate.status.toLowerCase(),
              created_at: new Date().toISOString()
            }];
          }
        } else if (this.table === 'milestones') {
          if (typeof window !== 'undefined') {
            const msStr = localStorage.getItem('nn_milestones');
            const current = msStr ? JSON.parse(msStr) : [];
            const index = current.findIndex((m: any) => Number(m.id) === Number(dbId));
            if (index !== -1) {
              current[index] = {
                ...current[index],
                ...this.updateData
              };
              localStorage.setItem('nn_milestones', JSON.stringify(current));
              data = [current[index]];
            }
          } else {
            try {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(process.cwd(), 'db', 'mock_db_milestones.json');
              if (fs.existsSync(filePath)) {
                const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const index = current.findIndex((m: any) => Number(m.id) === Number(dbId));
                if (index !== -1) {
                  current[index] = {
                    ...current[index],
                    ...this.updateData
                  };
                  fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
                  data = [current[index]];
                }
              }
            } catch (e: any) {
              console.error('Server update milestone error:', e);
            }
          }
        } else if (this.table === 'courses') {
          const current = loadMockTable('courses', getInitialDbCourses());
          const index = current.findIndex((c: any) => Number(c.id) === Number(dbId));
          if (index !== -1) {
            current[index] = {
              ...current[index],
              ...this.updateData,
              updated_at: new Date().toISOString()
            };
            saveMockTable('courses', current);
            data = [current[index]];
          }
        } else if (this.table === 'blog_posts') {
          const current = loadMockTable('blogposts', getInitialDbBlogPosts());
          const index = current.findIndex((p: any) => Number(p.id) === Number(dbId));
          if (index !== -1) {
            current[index] = {
              ...current[index],
              ...this.updateData
            };
            saveMockTable('blogposts', current);
            data = [current[index]];
          }
        } else if (this.table === 'library_items' || this.table === 'library') {
          const current = loadMockTable('library', getInitialDbLibraryItems());
          const index = current.findIndex((b: any) => Number(b.id) === Number(dbId));
          if (index !== -1) {
            current[index] = {
              ...current[index],
              ...this.updateData
            };
            saveMockTable('library', current);
            data = [current[index]];
          }
        } else if (this.table === 'enrollments') {
          const current = loadMockTable('enrollments', []);
          const index = current.findIndex((e: any) => Number(e.id) === Number(dbId));
          if (index !== -1) {
            current[index] = {
              ...current[index],
              ...this.updateData
            };
            saveMockTable('enrollments', current);
            data = [current[index]];
          }
        } else if (this.table === 'assignment_submissions') {
          const current = loadMockTable('assignment_submissions', []);
          const index = current.findIndex((s: any) => Number(s.id) === Number(dbId));
          if (index !== -1) {
            current[index] = {
              ...current[index],
              ...this.updateData
            };
            saveMockTable('assignment_submissions', current);
            data = [current[index]];
          }
        } else if (this.table === 'sessions') {
          const sessions = MockDatabase.getSessions();
          const sessionToUpdate = sessions.find(s => (parseInt(String(s.id).replace(/\D/g, '')) || 0) === Number(dbId));
          if (sessionToUpdate) {
            if (this.updateData.status) {
              sessionToUpdate.status = this.updateData.status.toUpperCase() as any;
            }
            if (this.updateData.notes !== undefined) (sessionToUpdate as any).notes = this.updateData.notes;
            if (this.updateData.goals_set !== undefined) (sessionToUpdate as any).goals_set = this.updateData.goals_set;
            if (this.updateData.progress_recorded !== undefined) (sessionToUpdate as any).progress_recorded = this.updateData.progress_recorded;
            if (this.updateData.completed_at !== undefined) (sessionToUpdate as any).completed_at = this.updateData.completed_at;
            
            MockDatabase.saveSessions(sessions);
            data = [{
              id: parseInt(String(sessionToUpdate.id).replace(/\D/g, '')) || 1,
              relationship_id: parseInt(String(sessionToUpdate.pairId).replace(/\D/g, '')) || 1,
              title: sessionToUpdate.title,
              scheduled_at: sessionToUpdate.dateTime,
              duration_minutes: (sessionToUpdate as any).duration_minutes || 60,
              status: sessionToUpdate.status.toLowerCase(),
              session_type: (sessionToUpdate as any).session_type || 'booked_slot',
              notes: (sessionToUpdate as any).notes || null,
              goals_set: (sessionToUpdate as any).goals_set || null,
              progress_recorded: (sessionToUpdate as any).progress_recorded || null,
              completed_at: (sessionToUpdate as any).completed_at || null,
            }];
          }
        }
      }

      if (this.isSingle || this.isMaybeSingle) {
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
        can_manage_blog: (u as any).can_manage_blog || false,
        can_manage_courses: (u as any).can_manage_courses || false,
        can_manage_library: (u as any).can_manage_library || false,
        is_accepting_mentees: (u as any).is_accepting_mentees !== undefined ? (u as any).is_accepting_mentees : true,
        max_mentees: (u as any).max_mentees || 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service_branch: (u as any).service_branch || u.command?.split(' ')[0] || 'Operations',
        years_of_service: (u as any).years_of_service !== undefined ? (u as any).years_of_service : 10,
        career_goals: (u as any).career_goals || '',
        mentorship_interests: (u as any).mentorship_interests || '',
        avatar_url: (u as any).avatar_url || null,
        additional_pictures: (u as any).additional_pictures || null,
        last_rank_held: u.lastRankHeld || null,
        years_served: u.yearsServed || null,
        years_since_retirement: u.yearsRetired || null,
        civilian_role: u.civilianRole || null,
        civilian_industry: u.civilianIndustry || null,
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
        id: parseInt(String(s.id).replace(/\D/g, '')) || 1,
        relationship_id: parseInt(String(s.pairId).replace(/\D/g, '')) || 1,
        title: s.title || ((s as any).session_type === 'proposed_time' ? 'Proposed Mentorship Session' : 'Scheduled Mentorship Session'),
        scheduled_at: s.dateTime,
        duration_minutes: (s as any).duration_minutes || 60,
        status: s.status.toLowerCase(),
        session_type: (s as any).session_type || 'booked_slot',
        notes: (s as any).notes || null,
        goals_set: (s as any).goals_set || null,
        progress_recorded: (s as any).progress_recorded || null,
        created_at: new Date().toISOString(),
        completed_at: (s as any).completed_at || null,
      }));
    } else if (this.table === 'goals') {
      const pairs = MockDatabase.getPairs();
      data = MockDatabase.getGoals().map(g => {
        const pair = g.pairId ? pairs.find(p => p.id === g.pairId) : null;
        const menteeIdStr = g.menteeId || (pair ? pair.menteeId : '');
        const mentorIdStr = g.mentorId || (pair ? pair.mentorId : '');
        return {
          id: parseInt(g.id.replace(/\D/g, '')) || 1,
          relationship_id: g.pairId ? (parseInt(g.pairId.replace(/\D/g, '')) || null) : null,
          title: g.title,
          description: '',
          status: g.status.toLowerCase(),
          mentee_id: menteeIdStr ? mapMockIdToDbId(menteeIdStr) : null,
          mentor_id: mentorIdStr ? mapMockIdToDbId(mentorIdStr) : null,
          created_at: new Date().toISOString()
        };
      });
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
      data = loadMockTable('courses', getInitialDbCourses());
    } else if (this.table === 'lessons') {
      data = loadMockTable('lessons', getInitialDbLessons());
    } else if (this.table === 'blog_posts') {
      data = loadMockTable('blogposts', getInitialDbBlogPosts());
    } else if (this.table === 'library_items' || this.table === 'library') {
      data = loadMockTable('library', getInitialDbLibraryItems());
    } else if (this.table === 'enrollments') {
      data = loadMockTable('enrollments', []);
    } else if (this.table === 'lesson_progress') {
      data = loadMockTable('lesson_progress', []);
    } else if (this.table === 'quiz_attempts') {
      data = loadMockTable('quiz_attempts', []);
    } else if (this.table === 'assignments') {
      data = loadMockTable('assignments', []);
    } else if (this.table === 'assignment_submissions') {
      data = loadMockTable('assignment_submissions', []);
    } else if (this.table === 'lesson_comments') {
      data = loadMockTable('lesson_comments', []);
    } else if (this.table === 'certificates') {
      data = loadMockTable('certificates', []);
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
    } else if (this.table === 'announcements') {
      data = MockDatabase.getAnnouncements().map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        target_role: a.targetRole.toLowerCase(),
        created_at: a.createdAt,
        sender_name: a.senderName
      }));
    } else if (this.table === 'notifications') {
      data = MockDatabase.getNotifications().map(n => ({
        id: n.id,
        user_id: mapMockIdToDbId(n.userId),
        type: n.type,
        title: n.title,
        message: n.message,
        time: n.time,
        read: n.read,
        link: n.link
      }));
    } else if (this.table === 'milestones') {
      if (typeof window !== 'undefined') {
        let msStr = localStorage.getItem('nn_milestones');
        if (!msStr) {
          const initialMs = getInitialMilestones();
          localStorage.setItem('nn_milestones', JSON.stringify(initialMs));
          msStr = JSON.stringify(initialMs);
        }
        data = JSON.parse(msStr);
      } else {
        try {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(process.cwd(), 'db', 'mock_db_milestones.json');
          if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          } else {
            data = getInitialMilestones();
            const dbDir = path.join(process.cwd(), 'db');
            if (!fs.existsSync(dbDir)) {
              fs.mkdirSync(dbDir);
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
          }
        } catch (e) {
          console.error('Server read milestones error:', e);
          data = getInitialMilestones();
        }
      }
    } else if (this.table === 'events') {
      if (typeof window !== 'undefined') {
        let evStr = localStorage.getItem('nn_events');
        if (!evStr) {
          const initialEvents = getInitialEvents();
          localStorage.setItem('nn_events', JSON.stringify(initialEvents));
          evStr = JSON.stringify(initialEvents);
        }
        data = JSON.parse(evStr);
      } else {
        try {
          const fs = require('fs');
          const path = require('path');
          const dbDir = path.join(process.cwd(), 'db');
          if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir);
          }
          const filePath = path.join(dbDir, 'mock_db_events.json');
          if (!fs.existsSync(filePath)) {
            const initialEvents = getInitialEvents();
            fs.writeFileSync(filePath, JSON.stringify(initialEvents, null, 2), 'utf8');
            data = initialEvents;
          } else {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          }
        } catch (e) {
          data = getInitialEvents();
        }
      }
    } else if (this.table === 'event_registrations') {
      if (typeof window !== 'undefined') {
        const regStr = localStorage.getItem('nn_event_registrations');
        data = regStr ? JSON.parse(regStr) : [];
      } else {
        try {
          const fs = require('fs');
          const path = require('path');
          const dbDir = path.join(process.cwd(), 'db');
          if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir);
          }
          const filePath = path.join(dbDir, 'mock_db_event_registrations.json');
          if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          } else {
            data = [];
          }
        } catch (e) {
          data = [];
        }
      }
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
        data = data.filter((row: any) => {
          const rVal = row[f.column];
          const fVal = f.value;
          if (rVal == fVal) return true;
          if (rVal !== null && rVal !== undefined && fVal !== null && fVal !== undefined) {
            return String(rVal) === String(fVal);
          }
          return rVal === fVal;
        });
      } else if (f.type === 'neq') {
        data = data.filter((row: any) => {
          const rVal = row[f.column];
          const fVal = f.value;
          if (rVal == fVal) return false;
          if (rVal !== null && rVal !== undefined && fVal !== null && fVal !== undefined) {
            return String(rVal) !== String(fVal);
          }
          return rVal !== fVal;
        });
      } else if (f.type === 'in') {
        const vals = (Array.isArray(f.value) ? f.value : [f.value]).map(v => String(v));
        data = data.filter((row: any) => {
          const rVal = row[f.column];
          return rVal !== null && rVal !== undefined && vals.includes(String(rVal));
        });
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

    if (this.isSingle || this.isMaybeSingle) {
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
      let email = token.replace('mock-token-', '');
      let userId = `mock-uuid-${email}`;

      if (token.startsWith('ey') && token.includes('.')) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = typeof window !== 'undefined'
              ? atob(payloadBase64)
              : Buffer.from(payloadBase64, 'base64').toString('utf8');
            const payload = JSON.parse(jsonStr);
            if (payload && payload.email) {
              email = payload.email;
              userId = payload.sub || `mock-uuid-${email}`;
            }
          }
        } catch (e) {
          console.error('Failed to parse JWT token in mock getUser:', e);
        }
      }

      return {
        data: {
          user: {
            id: userId,
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
  },
  storage: {
    listBuckets: async () => {
      return { data: [{ id: 'course-thumbnails' }], error: null };
    },
    createBucket: async (bucket: string, options?: any) => {
      return { data: { name: bucket }, error: null };
    },
    from: (bucket: string) => ({
      upload: async (filePath: string, fileBody: any, options?: any) => {
        if (typeof window !== 'undefined') {
          return { data: { path: filePath }, error: null };
        }
        try {
          const fs = require('fs');
          const path = require('path');
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          let buffer: Buffer;
          if (Buffer.isBuffer(fileBody)) {
            buffer = fileBody;
          } else if (fileBody instanceof ArrayBuffer) {
            buffer = Buffer.from(fileBody);
          } else if (typeof fileBody.arrayBuffer === 'function') {
            buffer = Buffer.from(await fileBody.arrayBuffer());
          } else {
            buffer = Buffer.from(fileBody);
          }
          fs.writeFileSync(path.join(uploadDir, filePath), buffer);
          return { data: { path: filePath }, error: null };
        } catch (e: any) {
          return { data: null, error: e };
        }
      },
      getPublicUrl: (filePath: string) => {
        return { data: { publicUrl: `/uploads/${filePath}` } };
      }
    })
  }
} as any;

function shouldFailover(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('timeout') || 
         msg.includes('connect') || 
         msg.includes('fetch failed') || 
         msg.includes('does not exist') || 
         msg.includes('schema cache') || 
         msg.includes('could not find') || 
         msg.includes('column') || 
         msg.includes('infinite recursion') ||
         msg.includes('policy') ||
         msg.includes('permission denied') ||
         (err.code && String(err.code).startsWith('PGRST')) || 
         err.code === 'P0001' || 
         err.code === '42P01' || 
         err.code === '42501' ||
         err.code === 'UND_ERR_CONNECT_TIMEOUT';
}

class SupabaseFailoverProxy {
  private useMock = isOfflineMode;
  private realClient: any;
  private mockClient: any;

  constructor(realClient: any, mockClient: any) {
    this.realClient = realClient;
    this.mockClient = mockClient;
  }

  private wrapPromise(promise: Promise<any>, fallbackFn: () => any) {
    return new Proxy(promise, {
      get: (target, prop, receiver) => {
        if (prop === 'then') {
          return (onfulfilled: any, onrejected?: any) => {
            return target.then(
              async (res) => {
                if (res && res.error && shouldFailover(res.error)) {
                  console.warn('Real Supabase returned error:', res.error.message, '. Failing over to mock database.');
                  this.useMock = true;
                  const mockResult = await fallbackFn();
                  return onfulfilled ? onfulfilled(mockResult) : mockResult;
                }
                return onfulfilled ? onfulfilled(res) : res;
              },
              async (err) => {
                if (shouldFailover(err)) {
                  console.warn('Real Supabase rejected with error. Failing over to mock database.');
                  this.useMock = true;
                  const mockResult = await fallbackFn();
                  return onfulfilled ? onfulfilled(mockResult) : mockResult;
                }
                if (onrejected) return onrejected(err);
                throw err;
              }
            );
          };
        }
        return (target as any)[prop];
      }
    });
  }

  public getClient() {
    const self = this;
    return new Proxy({}, {
      get(target, prop, receiver) {
        if (prop === 'auth') {
          if (self.useMock) return self.mockClient.auth;
          
          return new Proxy(self.realClient.auth, {
            get(authTarget, authProp) {
              const original = authTarget[authProp];
              if (typeof original === 'function') {
                if (authProp === 'onAuthStateChange') {
                  return original.bind(authTarget);
                }
                return async function(...args: any[]) {
                  try {
                    const res = await original.apply(authTarget, args);
                    if (res && res.error && shouldFailover(res.error)) {
                      console.warn('Supabase auth returned error, failing over to mock auth.');
                      self.useMock = true;
                      return (self.mockClient.auth as any)[authProp](...args);
                    }
                    return res;
                  } catch (err: any) {
                    if (shouldFailover(err)) {
                      console.warn('Supabase auth rejected with error, failing over to mock auth.');
                      self.useMock = true;
                      return (self.mockClient.auth as any)[authProp](...args);
                    }
                    throw err;
                  }
                };
              }
              return original;
            }
          });
        }

        if (prop === 'storage') {
          if (self.useMock) return self.mockClient.storage;
          
          return new Proxy(self.realClient.storage, {
            get(storageTarget, storageProp) {
              const original = storageTarget[storageProp];
              if (typeof original === 'function') {
                if (storageProp === 'listBuckets' || storageProp === 'createBucket') {
                  return async function(...args: any[]) {
                    try {
                      const res = await original.apply(storageTarget, args);
                      if (res && res.error && shouldFailover(res.error)) {
                        console.warn('Supabase storage returned error, failing over to mock storage.');
                        self.useMock = true;
                        return (self.mockClient.storage as any)[storageProp](...args);
                      }
                      return res;
                    } catch (err: any) {
                      if (shouldFailover(err)) {
                        console.warn('Supabase storage rejected with error, failing over to mock storage.');
                        self.useMock = true;
                        return (self.mockClient.storage as any)[storageProp](...args);
                      }
                      throw err;
                    }
                  };
                }
                return original.bind(storageTarget);
              }
              
              if (storageProp === 'from') {
                return (bucket: string) => {
                  try {
                    const bucketInstance = storageTarget.from(bucket);
                    return new Proxy(bucketInstance, {
                      get(bucketTarget, bucketProp) {
                        const orig = bucketTarget[bucketProp];
                        if (typeof orig === 'function') {
                          if (bucketProp === 'getPublicUrl') {
                            return function(...args: any[]) {
                              try {
                                if (self.useMock) {
                                  return (self.mockClient.storage as any).from(bucket).getPublicUrl(...args);
                                }
                                return orig.apply(bucketTarget, args);
                              } catch (err) {
                                if (shouldFailover(err)) {
                                  self.useMock = true;
                                  return (self.mockClient.storage as any).from(bucket).getPublicUrl(...args);
                                }
                                throw err;
                              }
                            };
                          }
                          
                          return async function(...args: any[]) {
                            try {
                              const res = await orig.apply(bucketTarget, args);
                              if (res && res.error && shouldFailover(res.error)) {
                                console.warn('Supabase storage bucket returned error, failing over to mock storage.');
                                self.useMock = true;
                                return (self.mockClient.storage as any).from(bucket)[bucketProp](...args);
                              }
                              return res;
                            } catch (err: any) {
                              if (shouldFailover(err)) {
                                console.warn('Supabase storage bucket rejected with error, failing over to mock storage.');
                                self.useMock = true;
                                return (self.mockClient.storage as any).from(bucket)[bucketProp](...args);
                              }
                              throw err;
                            }
                          };
                        }
                        return orig;
                      }
                    });
                  } catch (err) {
                    if (shouldFailover(err)) {
                      self.useMock = true;
                      return self.mockClient.storage.from(bucket);
                    }
                    throw err;
                  }
                };
              }
              return original;
            }
          });
        }

        if (self.useMock) {
          return self.mockClient[prop];
        }

        const original = self.realClient[prop];
        if (typeof original === 'function') {
          return function(...args: any[]) {
            if (prop === 'from') {
              const tableName = args[0];
              try {
                const queryBuilder = original.apply(self.realClient, args);
                return self.wrapQueryBuilder(queryBuilder, tableName);
              } catch (err) {
                if (shouldFailover(err)) {
                  self.useMock = true;
                  return self.mockClient.from(tableName);
                }
                throw err;
              }
            }
            
            try {
              const res = original.apply(self.realClient, args);
              if (res && typeof res.then === 'function') {
                return self.wrapPromise(res, () => (self.mockClient as any)[prop](...args));
              }
              return res;
            } catch (err) {
              if (shouldFailover(err)) {
                self.useMock = true;
                return (self.mockClient as any)[prop](...args);
              }
              throw err;
            }
          };
        }
        return original;
      }
    });
  }

  private wrapQueryBuilder(queryBuilder: any, tableName: string, calls: { method: string; args: any[] }[] = []) {
    const self = this;

    const builderProxy = new Proxy(queryBuilder, {
      get(target, prop, receiver) {
        const originalMethod = target[prop];
        if (typeof originalMethod === 'function') {
          return function(...args: any[]) {
            calls.push({ method: prop as string, args });
            const result = originalMethod.apply(target, args);
            
            if (result && typeof result.then === 'function') {
              return self.wrapPromise(result, async () => {
                let mockQuery = self.mockClient.from(tableName);
                for (const call of calls) {
                  if (typeof mockQuery[call.method] === 'function') {
                    mockQuery = mockQuery[call.method](...call.args);
                  }
                }
                return await mockQuery;
              });
            }
            
            return self.wrapQueryBuilder(result, tableName, calls);
          };
        }
        return originalMethod;
      }
    });
    return builderProxy;
  }
}

const realSupabase = isOfflineMode ? null : createClient(supabaseUrl, supabaseAnonKey);
const supabaseProxy = new SupabaseFailoverProxy(realSupabase, mockSupabase);
const supabase: SupabaseClient = supabaseProxy.getClient() as any;

const serviceRoleKey = typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : null;
const realServiceSupabase = isOfflineMode || !serviceRoleKey ? null : createClient(supabaseUrl, serviceRoleKey!);
const serviceSupabaseProxy = new SupabaseFailoverProxy(realServiceSupabase, mockSupabase);
export const supabaseService: SupabaseClient = serviceSupabaseProxy.getClient() as any;

export default supabase;
