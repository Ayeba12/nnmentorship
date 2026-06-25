export interface User {
  id: string;
  navyId: string;
  fullName: string;
  email: string;
  rank: string;
  specialization: string;
  command: string;
  role: "MENTEE" | "MENTOR_ACTIVE" | "MENTOR_RETIRED" | "ADMIN";
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
  bio: string;
  availabilityScore: number; // For mentors (0-10)
  historyScore: number;      // For mentors (0-10)
  
  // Retired/Veteran specific fields
  dischargeDocumentUrl?: string; // Simulated uploaded doc filename/base64
  lastRankHeld?: string;
  yearsServed?: number;
  yearsRetired?: number;
  civilianRole?: string;
  civilianIndustry?: string;
  isContentContributor?: boolean; // Granted to senior roles
}

export interface MentorshipPair {
  id: string;
  menteeId: string;
  mentorId: string;
  matchScore: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "REJECTED";
  matchReason: string;
  createdAt: string;
}

export interface Session {
  id: string;
  pairId: string;
  title: string;
  dateTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  goalsAddressed: string[];
}

export interface Message {
  id: string;
  pairId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Goal {
  id: string;
  pairId: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  performedBy: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  lessons: string[]; // List of lesson titles
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  fileSize: string;
  uploadedById: string;
  uploadedByName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  downloadCount: number;
  createdAt: string;
}

export interface UserCourseCompletion {
  id: string;
  userId: string;
  courseId: string;
  completedAt: string;
}

const INITIAL_USERS: User[] = [
  {
    id: "user-admin-1",
    navyId: "NN/0101",
    fullName: "Admiral Ibrahim Ola",
    email: "i.ola@navy.mil.ng",
    rank: "Admiral",
    specialization: "Navigation & Operations",
    command: "Western Naval Command (Lagos)",
    role: "ADMIN",
    status: "APPROVED",
    bio: "Chief of Naval Staff. Administrative oversight and policy coordinator.",
    availabilityScore: 10,
    historyScore: 10,
    isContentContributor: true
  },
  {
    id: "user-mentor-1",
    navyId: "NN/2542",
    fullName: "Captain Kelechi Amadi",
    email: "k.amadi@navy.mil.ng",
    rank: "Captain",
    specialization: "Marine Engineering",
    command: "Western Naval Command (Lagos)",
    role: "MENTOR_ACTIVE",
    status: "APPROVED",
    bio: "Veteran Engineering officer with 25 years afloat experience. Specialist in diesel propulsion and ship refits.",
    availabilityScore: 9,
    historyScore: 10,
    isContentContributor: true
  },
  {
    id: "user-mentor-2",
    navyId: "NN/3104",
    fullName: "Commodore Adebayo Balogun",
    email: "a.balogun@navy.mil.ng",
    rank: "Commodore",
    specialization: "Weapons Electrical",
    command: "Eastern Naval Command (Calabar)",
    role: "MENTOR_ACTIVE",
    status: "APPROVED",
    bio: "Expert in naval radar systems, combat management software, and electronic warfare countermeasures.",
    availabilityScore: 8,
    historyScore: 9,
    isContentContributor: true
  },
  {
    id: "user-mentor-3",
    navyId: "NN/4211",
    fullName: "Commander Olayemi Cole",
    email: "o.cole@navy.mil.ng",
    rank: "Commander",
    specialization: "Navigation & Operations",
    command: "Western Naval Command (Lagos)",
    role: "MENTOR_ACTIVE",
    status: "APPROVED",
    bio: "Commanding officer with extensive sea time in maritime security, piracy interdiction, and task force operations.",
    availabilityScore: 10,
    historyScore: 8,
    isContentContributor: false
  },
  {
    id: "user-mentor-retired-1",
    navyId: "NN/1045",
    fullName: "Rear Admiral Joseph Okonkwo (Rtd.)",
    email: "j.okonkwo@retired.navy.mil.ng",
    rank: "Rear Admiral",
    specialization: "Logistics & Supply",
    command: "Western Naval Command (Lagos)",
    role: "MENTOR_RETIRED",
    status: "APPROVED",
    bio: "Former Director of Logistics. Retired in 2024. Expert in international logistics chains and dockyard procurement strategy.",
    availabilityScore: 9,
    historyScore: 9,
    lastRankHeld: "Rear Admiral",
    yearsServed: 35,
    yearsRetired: 2,
    civilianRole: "Supply Chain Director",
    civilianIndustry: "Maritime Operations",
    isContentContributor: true
  },
  {
    id: "user-mentor-retired-pending",
    navyId: "NN/1802",
    fullName: "Captain Muhammad Bello (Rtd.)",
    email: "m.bello@retired.navy.mil.ng",
    rank: "Captain",
    specialization: "Naval Intelligence",
    command: "Central Naval Command (Yenagoa)",
    role: "MENTOR_RETIRED",
    status: "PENDING",
    bio: "Retired intelligence strategist. Transitioned to civilian intelligence auditing. Document uploaded.",
    availabilityScore: 8,
    historyScore: 8,
    lastRankHeld: "Captain",
    yearsServed: 28,
    yearsRetired: 4,
    civilianRole: "Security Consultant",
    civilianIndustry: "Private Security",
    dischargeDocumentUrl: "discharge_bell_muhammad.pdf",
    isContentContributor: true
  },
  {
    id: "user-mentee-1",
    navyId: "NN/8421",
    fullName: "Lieutenant Yusuf Musa",
    email: "y.musa@navy.mil.ng",
    rank: "Lieutenant",
    specialization: "Marine Engineering",
    command: "Western Naval Command (Lagos)",
    role: "MENTEE",
    status: "APPROVED",
    bio: "Sub-lieutenant engineer seeking mentorship in naval auxiliary machinery and dockyard maintenance coordination.",
    availabilityScore: 0,
    historyScore: 0,
  },
  {
    id: "user-mentee-2",
    navyId: "NN/9122",
    fullName: "Sub-Lieutenant Fatima Bello",
    email: "f.bello@navy.mil.ng",
    rank: "Sub-Lieutenant",
    specialization: "Weapons Electrical",
    command: "Eastern Naval Command (Calabar)",
    role: "MENTEE",
    status: "APPROVED",
    bio: "Officer in training focused on sonar calibrations and weapons alignment protocols.",
    availabilityScore: 0,
    historyScore: 0,
  },
  {
    id: "user-mentee-3",
    navyId: "NN/9543",
    fullName: "Midshipman Emeka Okafor",
    email: "e.okafor@navy.mil.ng",
    rank: "Midshipman",
    specialization: "Navigation & Operations",
    command: "Western Naval Command (Lagos)",
    role: "MENTEE",
    status: "PENDING",
    bio: "Recent graduate of the Nigerian Defence Academy. Seeking mentorship in watchkeeping and coastal navigation.",
    availabilityScore: 0,
    historyScore: 0,
  },
];

const INITIAL_PAIRS: MentorshipPair[] = [
  {
    id: "pair-1",
    menteeId: "user-mentee-1",
    mentorId: "user-mentor-1",
    matchScore: 100,
    status: "ACTIVE",
    matchReason: "Perfect specialization match (Marine Engineering), identical command location, and optimal rank spacing.",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pair-2",
    menteeId: "user-mentee-2",
    mentorId: "user-mentor-2",
    matchScore: 92,
    status: "ACTIVE",
    matchReason: "Strong fit in Weapons Electrical alignment, matching Calabar command location.",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pair-3",
    menteeId: "user-mentee-1",
    mentorId: "user-mentor-retired-1",
    matchScore: 85,
    status: "COMPLETED",
    matchReason: "Valuable guidance for transition and procurement systems logic.",
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pair-4",
    menteeId: "user-mentee-3",
    mentorId: "user-mentor-1",
    matchScore: 95,
    status: "PENDING",
    matchReason: "High correlation in coastal watchkeeping objectives.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pair-5",
    menteeId: "user-mentee-2",
    mentorId: "user-mentor-retired-1",
    matchScore: 78,
    status: "REJECTED",
    matchReason: "Mismatched command location and availability schedule.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const INITIAL_GOALS: Goal[] = [
  {
    id: "goal-1",
    pairId: "pair-1",
    title: "Master diesel generator load balancing procedures",
    status: "IN_PROGRESS",
  },
  {
    id: "goal-2",
    pairId: "pair-1",
    title: "Complete Officer of the Watch engineering log approvals",
    status: "COMPLETED",
  },
  {
    id: "goal-3",
    pairId: "pair-1",
    title: "Develop Dockyard Refit Safety Checklist",
    status: "PENDING",
  },
  {
    id: "goal-4",
    pairId: "pair-2",
    title: "Learn combat management software system navigation",
    status: "IN_PROGRESS",
  },
  {
    id: "goal-5",
    pairId: "pair-2",
    title: "Calibrate vessel weapons electrical alignment",
    status: "COMPLETED",
  },
  {
    id: "goal-6",
    pairId: "pair-3",
    title: "Create civilian maritime transition plan",
    status: "COMPLETED",
  }
];

const INITIAL_SESSIONS: Session[] = [
  {
    id: "session-1",
    pairId: "pair-1",
    title: "Initial Matching & Action Plan Review",
    dateTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    goalsAddressed: ["Complete Officer of the Watch engineering log approvals"],
  },
  {
    id: "session-2",
    pairId: "pair-1",
    title: "Propulsion Load Balancing & Auxiliary Diagnostics",
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "SCHEDULED",
    goalsAddressed: ["Master diesel generator load balancing procedures"],
  },
  {
    id: "session-3",
    pairId: "pair-2",
    title: "Combat Software Training",
    dateTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    goalsAddressed: ["Learn combat management software system navigation"],
  },
  {
    id: "session-4",
    pairId: "pair-2",
    title: "Weapons Alignment Protocol Review",
    dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    goalsAddressed: ["Calibrate vessel weapons electrical alignment"],
  },
  {
    id: "session-5",
    pairId: "pair-2",
    title: "System Check & Refit Review",
    dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "SCHEDULED",
    goalsAddressed: [],
  },
  {
    id: "session-6",
    pairId: "pair-3",
    title: "Intro to Supply Chain Management",
    dateTime: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    goalsAddressed: ["Create civilian maritime transition plan"],
  }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-1",
    pairId: "pair-1",
    senderId: "user-mentee-1",
    content: "Good morning, Captain. I have drafted the safety checklist for the dockyard refit next week.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    pairId: "pair-1",
    senderId: "user-mentor-1",
    content: "Well done, Lieutenant. Send it over, and let's review it during our scheduled call on Friday. Focus on safety margins.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-3",
    pairId: "pair-1",
    senderId: "user-mentee-1",
    content: "Understood, Sir. I will submit it before Friday.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    action: "System Matching Engine initialized.",
    timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    performedBy: "System",
  },
  {
    id: "log-2",
    action: "Mentee Yusuf Musa approved.",
    timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    performedBy: "Admiral Ibrahim Ola",
  },
  {
    id: "log-3",
    action: "Matching pair created: Yusuf Musa & Kelechi Amadi.",
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    performedBy: "Admiral Ibrahim Ola",
  },
  {
    id: "log-4",
    action: "Mentee Fatima Bello approved.",
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    performedBy: "Admiral Ibrahim Ola",
  },
  {
    id: "log-5",
    action: "Matching pair created: Fatima Bello & Adebayo Balogun.",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    performedBy: "Admiral Ibrahim Ola",
  },
  {
    id: "log-6",
    action: "Course 'Officer of the Watch (OOW) Watchkeeping' approved.",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    performedBy: "Admiral Ibrahim Ola",
  },
  {
    id: "log-7",
    action: "Library book 'Officer of the Watch Seamanship Reference Manual' approved.",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    performedBy: "Admiral Ibrahim Ola",
  }
];

const INITIAL_BLOGS: BlogArticle[] = [
  {
    id: "post-1",
    title: "Watchkeeping Principles & Precision Navigation at Sea",
    content: "Precision watchkeeping is the cornerstone of maritime safety. As officers of the deck, your vigilance is the shield that guards the ship, crew, and mission. Ensure you verify GPS parameters with manual compass sightings every watch rotation.",
    authorId: "user-mentor-3",
    authorName: "Commander Olayemi Cole",
    category: "Navigation & Tactics",
    tags: ["Watchkeeping", "Navigation", "Operations"],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "post-2",
    title: "Transitioning to Maritime Corporate Supply Chains: A Veteran Guide",
    content: "Transitioning out of active duty is a significant milestone. The logistical planning, chain of command leadership, and risk management skills you acquired in the Nigerian Navy map directly to corporate port logistics and supply chain optimization. Start building networks early.",
    authorId: "user-mentor-retired-1",
    authorName: "Rear Admiral Joseph Okonkwo (Rtd.)",
    category: "Career Transition",
    tags: ["Logistics", "Veterans", "Career"],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "post-3",
    title: "Naval Leadership & Decision Making in High-Stress Environments",
    content: "Under pressure, command decisions must be swift and clear. Leadership at sea requires an understanding of team dynamics, situational awareness, and delegation. Cultivate trust with your bridge team during calm waters so it holds firm in high seas.",
    authorId: "user-mentor-1",
    authorName: "Captain Ibrahim Bello",
    category: "Navigation & Tactics",
    tags: ["Leadership", "Command", "Tactics"],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "post-4",
    title: "Propulsion System Maintenance: Preventing Marine Machinery Failures",
    content: "Marine diesel engines and electrical propulsion grids require rigorous preventative maintenance schedules. Monitoring fuel oil purity, cooling loop temperatures, and alignment shafts is critical to avoiding propulsion loss during underway operations.",
    authorId: "user-mentor-4",
    authorName: "Lt. Commander Kelechi Amadi",
    category: "Marine Engineering",
    tags: ["Engineering", "Maintenance", "Propulsion"],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "post-5",
    title: "Logistical Readiness: Supply Chain Strategies for Extended Deployments",
    content: "A ship is only as operational as its stores allow. Operational supply chain logistics require predicting demand for spare parts, dry provisions, and fuel oil bunkering. Rigorous tracking of replenishment-at-sea guidelines ensures uninterrupted patrol operations.",
    authorId: "user-mentor-5",
    authorName: "Commander Amina Yusuf",
    category: "Logistics & Supply",
    tags: ["Logistics", "Supply", "Underway Replenishment"],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "post-6",
    title: "Analysis of Maritime Domain Awareness Systems in the Gulf of Guinea",
    content: "Modern naval intelligence relies heavily on integrated maritime domain awareness (MDA). By fusing satellite AIS data, coastal radar sweeps, and aerial patrol feeds, command centers can identify illegal bunkering and piracy activities before they reach regional shipping lanes.",
    authorId: "user-mentor-6",
    authorName: "Lt. Commander Yusuf Musa",
    category: "Naval Intelligence",
    tags: ["Intelligence", "MDA", "Security"],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "post-7",
    title: "Standard Operational Procedures: Quick Reference Guide to COLREGs",
    content: "Adherence to the International Regulations for Preventing Collisions at Sea (COLREGs) is mandatory for every watchstander. This quick-reference guide breaks down rules for crossing situations, head-on encounters, and overtaking responsibilities to maintain safe CPA distances.",
    authorId: "user-mentor-3",
    authorName: "Commander Olayemi Cole",
    category: "Doctrine & Manuals",
    tags: ["COLREGs", "Watchkeeping", "SOP"],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "post-pending",
    title: "Tactical Operations in the Gulf of Guinea: Anti-Piracy Lessons",
    content: "Recent operations in the Gulf of Guinea have shown the importance of rapid boarding team deployment. The integration of helicopter support with fast interceptor boats provides a decisive tactical advantage. Here are three command principles for boarding officer training...",
    authorId: "user-mentor-retired-pending",
    authorName: "Muhammad Bello (Rtd.)",
    category: "Tactical Intelligence",
    tags: ["Security", "Maritime Warfare"],
    status: "PENDING",
    createdAt: new Date().toISOString()
  }
];

const INITIAL_COURSES: Course[] = [
  {
    id: "course-1",
    title: "Officer of the Watch (OOW) Watchkeeping & Seamanship",
    description: "Essential training module covering radar plotting, collision avoidance regulations (COLREGs), and bridge deck team management.",
    instructorId: "user-mentor-3",
    instructorName: "Commander Olayemi Cole",
    lessons: [
      "Introduction to Seamanship & Nautical Rules",
      "COLREGs & Radar Collision Plotting",
      "Bridge Communication and Watch Handover Protocols",
      "Emergency Operations: Man Overboard and Anchoring Protocols"
    ],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "course-2",
    title: "Afloat Diesel Propulsion Operations & Auxiliary Diagnostics",
    description: "Deep dive study for marine engineering officers on maintaining MTU auxiliary power generators, diesel combustion logs, and gearbox refits.",
    instructorId: "user-mentor-1",
    instructorName: "Captain Kelechi Amadi",
    lessons: [
      "Marine Diesel Engine Fundamental Mechanics",
      "Refit Diagnostics & Pressure Log Verification",
      "Auxiliary Power Grid Load Balancing",
      "Dockyard Maintenance Refit Protocols"
    ],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "course-3",
    title: "Maritime Boundary Law & EEZ Patrol Strategy",
    description: "Legal and tactical frameworks for patrolling Nigeria's Exclusive Economic Zone, prosecuting illegal fishing, and implementing Gulf of Guinea security accords.",
    instructorId: "user-mentor-retired-1",
    instructorName: "Rear Admiral Joseph Okonkwo (Rtd.)",
    lessons: [
      "Introduction to Maritime Jurisdiction",
      "EEZ Policing & Rules of Engagement",
      "Boarding Operations Legal Procedures",
      "International Piracy Tribunals Case Studies"
    ],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "course-4",
    title: "Combat Systems Alignment & Electronic Warfare",
    description: "Technical manuals on radar calibration, fire control systems, and jamming countermeasures for electrical engineering officers.",
    instructorId: "user-mentor-2",
    instructorName: "Commodore Adebayo Balogun",
    lessons: [
      "Radar Target Acquisition & Tracking",
      "Electronic Support Measures (ESM)",
      "Weapons Control System Integration",
      "Anti-Ship Missile Countermeasures"
    ],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "course-5",
    title: "Naval Logistics, Supply Chain & Fleet Sustainment",
    description: "Detailed training on replenishment at sea, dockyard procurement, and spare parts cataloging for logistics officers.",
    instructorId: "user-mentor-retired-1",
    instructorName: "Rear Admiral Joseph Okonkwo (Rtd.)",
    lessons: [
      "Replenishment at Sea (RAS) Operations",
      "Naval Dockyard Inventory Systems",
      "Fleet Asset Lifecycle Planning",
      "Global Maritime Supply Networks"
    ],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "course-6",
    title: "Hydrographic Surveying & Sea Charting Protocols",
    description: "Advanced course on sonar bathymetry, tidal corrections, and compiling official charts for the Nigerian Navy Hydrographic Office.",
    instructorId: "user-mentor-1",
    instructorName: "Captain Kelechi Amadi",
    lessons: [
      "Single-beam & Multi-beam Sonar Operation",
      "Tidal Heights & Data Correction",
      "Electronic Navigational Charts (ENC) Standards",
      "Submarine Topography Mapping"
    ],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "course-7",
    title: "Naval Command Leadership & Administrative Doctrine",
    description: "Officer-level training covering staff writing, operational briefing structures, military justice procedures, and command ethics.",
    instructorId: "user-mentor-3",
    instructorName: "Commander Olayemi Cole",
    lessons: [
      "Naval Staff Correspondence & Writing",
      "Operational Briefing & Command Presence",
      "Code of Conduct & Military Justice",
      "Crisis Decision Making Paradigms"
    ],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "course-8",
    title: "Search and Rescue (SAR) Mission Coordination",
    description: "Tactical procedures for search pattern planning, communications with maritime rescue coordination centers, and rescue helicopter operations.",
    instructorId: "user-mentor-3",
    instructorName: "Commander Olayemi Cole",
    lessons: [
      "SAR Comm & Distress Frequencies",
      "Search Pattern Plotting & Drift Calculations",
      "Helicopter Deck Operations at Sea",
      "Multi-agency Incident Command Systems"
    ],
    status: "APPROVED",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "course-pending",
    title: "Naval Intelligence Gathering & Reconnaissance Strategies",
    description: "Detailed seminar outlining signal intelligence parsing, radar interception logs, and littoral zone intelligence networks.",
    instructorId: "user-mentor-retired-pending",
    instructorName: "Muhammad Bello (Rtd.)",
    lessons: [
      "Signal Intelligence Fundamentals",
      "Reconnaissance Log Compilation",
      "Littoral Threat Identification Protocols"
    ],
    status: "PENDING",
    createdAt: new Date().toISOString()
  }
];

const INITIAL_BOOKS: LibraryBook[] = [
  {
    id: "book-1",
    title: "Nigerian Navy Doctrine 2020",
    author: "Navy Headquarters (NHQ)",
    category: "Doctrine",
    fileSize: "4.8 MB",
    uploadedById: "user-admin-1",
    uploadedByName: "Admiral Ibrahim Ola",
    status: "APPROVED",
    downloadCount: 142,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "book-2",
    title: "Officer of the Watch Seamanship Reference Manual",
    author: "Naval Training Command",
    category: "Manuals",
    fileSize: "12.4 MB",
    uploadedById: "user-mentor-3",
    uploadedByName: "Commander Olayemi Cole",
    status: "APPROVED",
    downloadCount: 98,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "book-pending",
    title: "Logistical Support Strategies for Patrol Vessels at Sea",
    author: "Rear Admiral Joseph Okonkwo (Rtd.)",
    category: "Logistics",
    fileSize: "2.1 MB",
    uploadedById: "user-mentor-retired-1",
    uploadedByName: "Rear Admiral Joseph Okonkwo (Rtd.)",
    status: "PENDING",
    downloadCount: 0,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_COMPLETIONS: UserCourseCompletion[] = [
  {
    id: "comp-1",
    userId: "user-mentee-1",
    courseId: "course-2",
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export class MockDatabase {
  private static getKey(key: string): string {
    return `nn_mentorship_${key}`;
  }

  private static load<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") {
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'db', `mock_db_${key}.json`);
        if (fs.existsSync(filePath)) {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      } catch (e) {
        console.error('Server DB read error:', e);
      }
      return defaultValue;
    }
    const data = localStorage.getItem(this.getKey(key));
    return data ? JSON.parse(data) : defaultValue;
  }

  private static save<T>(key: string, data: T): void {
    if (typeof window === "undefined") {
      try {
        const fs = require('fs');
        const path = require('path');
        const dbDir = path.join(process.cwd(), 'db');
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir);
        }
        const filePath = path.join(dbDir, `mock_db_${key}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {
        console.error('Server DB write error:', e);
      }
      return;
    }
    localStorage.setItem(this.getKey(key), JSON.stringify(data));
  }

  // Database initialization
  public static initialize(): void {
    if (typeof window === "undefined") {
      try {
        const fs = require('fs');
        const path = require('path');
        const dbDir = path.join(process.cwd(), 'db');
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir);
        }
        const filePath = path.join(dbDir, 'mock_db_users.json');
        if (!fs.existsSync(filePath)) {
          this.save("users", INITIAL_USERS);
          this.save("pairs", INITIAL_PAIRS);
          this.save("goals", INITIAL_GOALS);
          this.save("sessions", INITIAL_SESSIONS);
          this.save("messages", INITIAL_MESSAGES);
          this.save("audit_logs", INITIAL_AUDIT_LOGS);
          
          this.save("blog_articles", INITIAL_BLOGS);
          this.save("courses", INITIAL_COURSES);
          this.save("library_books", INITIAL_BOOKS);
          this.save("course_completions", INITIAL_COMPLETIONS);
        }
      } catch (e) {
        console.error('Server DB initialize error:', e);
      }
      return;
    }

    if (!localStorage.getItem(this.getKey("users"))) {
      this.save("users", INITIAL_USERS);
      this.save("pairs", INITIAL_PAIRS);
      this.save("goals", INITIAL_GOALS);
      this.save("sessions", INITIAL_SESSIONS);
      this.save("messages", INITIAL_MESSAGES);
      this.save("audit_logs", INITIAL_AUDIT_LOGS);
      
      this.save("blog_articles", INITIAL_BLOGS);
      this.save("courses", INITIAL_COURSES);
      this.save("library_books", INITIAL_BOOKS);
      this.save("course_completions", INITIAL_COMPLETIONS);
    } else {
      // Sync latest courses if counts differ
      const existingCourses = localStorage.getItem(this.getKey("courses"));
      if (!existingCourses || JSON.parse(existingCourses).length < 5) {
        this.save("courses", INITIAL_COURSES);
      }
    }
  }

  // Users
  public static getUsers(): User[] {
    return this.load("users", INITIAL_USERS);
  }

  public static saveUsers(users: User[]): void {
    this.save("users", users);
  }

  public static getUserById(userId: string): User | undefined {
    return this.getUsers().find((u) => u.id === userId);
  }

  public static updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
      this.saveUsers(users);
    }
  }

  public static updateUserStatus(userId: string, status: User["status"], adminName: string): void {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.status = status;
      this.saveUsers(users);
      this.addAuditLog(`User status for ${user.fullName} updated to ${status}.`, adminName);
    }
  }

  // Pairs
  public static getPairs(): MentorshipPair[] {
    return this.load("pairs", INITIAL_PAIRS);
  }

  public static savePairs(pairs: MentorshipPair[]): void {
    this.save("pairs", pairs);
  }

  public static createPair(menteeId: string, mentorId: string, score: number, reason: string, adminName: string): MentorshipPair {
    const pairs = this.getPairs();
    const users = this.getUsers();
    
    const mentee = users.find((u) => u.id === menteeId);
    const mentor = users.find((u) => u.id === mentorId);

    const newPair: MentorshipPair = {
      id: `pair-${Date.now()}`,
      menteeId,
      mentorId,
      matchScore: score,
      status: "ACTIVE",
      matchReason: reason,
      createdAt: new Date().toISOString(),
    };

    pairs.push(newPair);
    this.savePairs(pairs);

    if (mentee && mentor) {
      this.addAuditLog(`Mentorship pair created: ${mentee.fullName} (Mentee) & ${mentor.fullName} (Mentor) with score ${score}%.`, adminName);
    }

    return newPair;
  }

  public static requestPair(menteeId: string, mentorId: string, score: number, reason: string): MentorshipPair {
    const pairs = this.getPairs();
    const users = this.getUsers();
    
    const mentee = users.find((u) => u.id === menteeId);
    const mentor = users.find((u) => u.id === mentorId);

    const newPair: MentorshipPair = {
      id: `pair-${Date.now()}`,
      menteeId,
      mentorId,
      matchScore: score,
      status: "PENDING",
      matchReason: reason,
      createdAt: new Date().toISOString(),
    };

    pairs.push(newPair);
    this.savePairs(pairs);

    if (mentee && mentor) {
      this.addAuditLog(`Mentorship request submitted by ${mentee.fullName} to ${mentor.fullName} (Compatibility: ${score}%).`, mentee.fullName);
    }

    return newPair;
  }

  public static updatePairStatus(pairId: string, status: MentorshipPair["status"], userName: string): void {
    const pairs = this.getPairs();
    const pair = pairs.find((p) => p.id === pairId);
    if (pair) {
      pair.status = status;
      this.savePairs(pairs);
      this.addAuditLog(`Mentorship pair ${pairId} status updated to ${status}.`, userName);
    }
  }

  // Goals
  public static getGoals(): Goal[] {
    return this.load("goals", INITIAL_GOALS);
  }

  public static saveGoals(goals: Goal[]): void {
    this.save("goals", goals);
  }

  public static addGoal(pairId: string, title: string, userName: string): Goal {
    const goals = this.getGoals();
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      pairId,
      title,
      status: "PENDING",
    };
    goals.push(newGoal);
    this.saveGoals(goals);
    this.addAuditLog(`Goal '${title}' created for pair ${pairId}.`, userName);
    return newGoal;
  }

  public static updateGoalStatus(goalId: string, status: Goal["status"], userName: string): void {
    const goals = this.getGoals();
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      goal.status = status;
      this.saveGoals(goals);
      this.addAuditLog(`Goal '${goal.title}' status updated to ${status}.`, userName);
    }
  }

  // Sessions
  public static getSessions(): Session[] {
    return this.load("sessions", INITIAL_SESSIONS);
  }

  public static saveSessions(sessions: Session[]): void {
    this.save("sessions", sessions);
  }

  public static scheduleSession(pairId: string, title: string, dateTime: string, goalsAddressed: string[], userName: string): Session {
    const sessions = this.getSessions();
    const newSession: Session = {
      id: `session-${Date.now()}`,
      pairId,
      title,
      dateTime,
      status: "SCHEDULED",
      goalsAddressed,
    };
    sessions.push(newSession);
    this.saveSessions(sessions);
    this.addAuditLog(`Session '${title}' scheduled for ${new Date(dateTime).toLocaleString()}.`, userName);
    return newSession;
  }

  public static updateSessionStatus(sessionId: string, status: Session["status"], userName: string): void {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      session.status = status;
      this.saveSessions(sessions);
      this.addAuditLog(`Session '${session.title}' status updated to ${status}.`, userName);
    }
  }

  // Messages
  public static getMessages(): Message[] {
    return this.load("messages", INITIAL_MESSAGES);
  }

  public static saveMessages(messages: Message[]): void {
    this.save("messages", messages);
  }

  public static sendMessage(pairId: string, senderId: string, content: string): Message {
    const messages = this.getMessages();
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      pairId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
    };
    messages.push(newMessage);
    this.saveMessages(messages);
    return newMessage;
  }

  // Blog Articles
  public static getBlogArticles(): BlogArticle[] {
    return this.load("blog_articles", INITIAL_BLOGS);
  }

  public static saveBlogArticles(blogs: BlogArticle[]): void {
    this.save("blog_articles", blogs);
  }

  public static createBlogArticle(title: string, content: string, authorId: string, authorName: string, category: string, tags: string[]): BlogArticle {
    const blogs = this.getBlogArticles();
    const newArticle: BlogArticle = {
      id: `post-${Date.now()}`,
      title,
      content,
      authorId,
      authorName,
      category,
      tags,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    blogs.push(newArticle);
    this.saveBlogArticles(blogs);
    this.addAuditLog(`Blog article '${title}' submitted for approval by ${authorName}.`, authorName);
    return newArticle;
  }

  public static updateBlogStatus(articleId: string, status: BlogArticle["status"], adminName: string): void {
    const blogs = this.getBlogArticles();
    const article = blogs.find((b) => b.id === articleId);
    if (article) {
      article.status = status;
      this.saveBlogArticles(blogs);
      this.addAuditLog(`Blog article '${article.title}' status updated to ${status}.`, adminName);
    }
  }

  // Courses
  public static getCourses(): Course[] {
    return this.load("courses", INITIAL_COURSES);
  }

  public static saveCourses(courses: Course[]): void {
    this.save("courses", courses);
  }

  public static createCourse(title: string, description: string, instructorId: string, instructorName: string, lessons: string[]): Course {
    const courses = this.getCourses();
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title,
      description,
      instructorId,
      instructorName,
      lessons,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    courses.push(newCourse);
    this.saveCourses(courses);
    this.addAuditLog(`Course '${title}' submitted for approval by ${instructorName}.`, instructorName);
    return newCourse;
  }

  public static updateCourseStatus(courseId: string, status: Course["status"], adminName: string): void {
    const courses = this.getCourses();
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      course.status = status;
      this.saveCourses(courses);
      this.addAuditLog(`Course '${course.title}' status updated to ${status}.`, adminName);
    }
  }

  // Library Books
  public static getLibraryBooks(): LibraryBook[] {
    return this.load("library_books", INITIAL_BOOKS);
  }

  public static saveLibraryBooks(books: LibraryBook[]): void {
    this.save("library_books", books);
  }

  public static uploadBook(title: string, author: string, category: string, fileSize: string, uploaderId: string, uploaderName: string): LibraryBook {
    const books = this.getLibraryBooks();
    const newBook: LibraryBook = {
      id: `book-${Date.now()}`,
      title,
      author,
      category,
      fileSize,
      uploadedById: uploaderId,
      uploadedByName: uploaderName,
      status: "PENDING",
      downloadCount: 0,
      createdAt: new Date().toISOString()
    };
    books.push(newBook);
    this.saveLibraryBooks(books);
    this.addAuditLog(`Library publication '${title}' submitted by ${uploaderName}.`, uploaderName);
    return newBook;
  }

  public static updateBookStatus(bookId: string, status: LibraryBook["status"], adminName: string): void {
    const books = this.getLibraryBooks();
    const book = books.find((b) => b.id === bookId);
    if (book) {
      book.status = status;
      this.saveLibraryBooks(books);
      this.addAuditLog(`Library book '${book.title}' status updated to ${status}.`, adminName);
    }
  }

  public static recordDownload(bookId: string): void {
    const books = this.getLibraryBooks();
    const book = books.find((b) => b.id === bookId);
    if (book) {
      book.downloadCount += 1;
      this.saveLibraryBooks(books);
    }
  }

  // Course Completions
  public static getCompletions(): UserCourseCompletion[] {
    return this.load("course_completions", INITIAL_COMPLETIONS);
  }

  public static saveCompletions(completions: UserCourseCompletion[]): void {
    this.save("course_completions", completions);
  }

  public static completeCourse(userId: string, courseId: string): UserCourseCompletion {
    const completions = this.getCompletions();
    const newComp: UserCourseCompletion = {
      id: `comp-${Date.now()}`,
      userId,
      courseId,
      completedAt: new Date().toISOString()
    };
    completions.push(newComp);
    this.saveCompletions(completions);
    
    const user = this.getUserById(userId);
    const course = this.getCourses().find((c) => c.id === courseId);
    if (user && course) {
      this.addAuditLog(`Mentee ${user.fullName} completed course '${course.title}'.`, user.fullName);
    }
    
    return newComp;
  }

  // Audit Logs
  public static getAuditLogs(): AuditLog[] {
    return this.load("audit_logs", INITIAL_AUDIT_LOGS);
  }

  public static addAuditLog(action: string, performedBy: string): void {
    const logs = this.load("audit_logs", INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      performedBy,
    };
    logs.unshift(newLog); // Put new logs at the beginning
    this.save("audit_logs", logs);
  }

  // Active Session simulation
  public static getActiveUser(): User | null {
    if (typeof window === "undefined") return null;
    const activeId = localStorage.getItem("nn_active_user_id");
    if (!activeId) return null;
    return this.getUserById(activeId) || null;
  }

  public static setActiveUser(userId: string | null): void {
    if (typeof window === "undefined") return;
    if (userId) {
      localStorage.setItem("nn_active_user_id", userId);
    } else {
      localStorage.removeItem("nn_active_user_id");
    }
  }
}
