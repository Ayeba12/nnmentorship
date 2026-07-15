
NIGERIAN NAVY MENTORSHIP PLATFORM
MASTER SYSTEM ARCHITECTURE & BUILD SPECIFICATION

1. SYSTEM OVERVIEW
Institutional-grade mentorship coordination platform for naval personnel and veterans.

CORE OBJECTIVE
Match mentees with mentors, facilitate mentorship sessions, track progress, and provide administrative oversight.

2. CORE SYSTEM RULE
Strict role isolation. Separate apps:
- Mentee App
- Mentor App
- Admin Panel
- CMS (Strapi)
- Backend API (NestJS)

3. STACK
Frontend: Next.js, Tailwind, TypeScript
Backend: NestJS, Prisma, PostgreSQL, Redis
CMS: Strapi
Realtime: WebSockets
DevOps: Docker, Vercel, Railway/Render/AWS

4. ARCHITECTURE
Frontend apps connect to NestJS API.
Backend modules: Auth, Users, Matching, Mentorship, Messaging, Admin, Audit.
DB: PostgreSQL + Redis.
CMS: Strapi for content only.

5. ROLES
MENTEE, MENTOR (ACTIVE), MENTOR (RETIRED), ADMIN, CONTENT CONTRIBUTOR

6. AUTH
JWT auth, refresh tokens, admin approval required.
User status: PENDING, APPROVED, SUSPENDED, REJECTED.

7. DATABASE CORE TABLES
users, profiles, mentorship_pairs, sessions, messages, goals, audit_logs

8. MATCHING ENGINE
score = specialization*4 + rank_gap*3 + command*2 + availability*3 + history*2

9. MESSAGING
WebSocket based chat scoped by mentorship pair with Redis pub/sub.

10. ADMIN SYSTEM
User approvals, role changes, mentor assignment, session control, audit logs.

11. SECURITY
JWT, RBAC + ABAC + ReBAC, audit logs, TLS encryption.

12. DEPLOYMENT
Frontend: Vercel
Backend: Railway/Render/AWS
DB: PostgreSQL
Redis: Upstash/Redis Cloud

13. BUILD PHASES
Phase 1: Auth + Users + Matching + Admin
Phase 2: Messaging + Sessions + Goals
Phase 3: CMS + Analytics + Audit expansion

END
