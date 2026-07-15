# NIGERIAN NAVY MENTORSHIP PLATFORM
## AI AGENT EXECUTION TASK LIST (DEMO BUILD)

---

# RULES (READ FIRST — NON-NEGOTIABLE)

The AI agent must:

- Build ONLY the defined scope
- Do NOT add extra features
- Do NOT introduce microservices
- Do NOT introduce Kafka, event bus, or unnecessary architecture
- Keep system MONOLITHIC (NestJS backend)
- Prioritize working end-to-end flow over perfection
- Follow task order strictly

---

# PHASE 0 — PROJECT INITIALIZATION

## TASK 0.1 — Create Monorepo Structure
- Create root project folder
- Create apps/backend (NestJS)
- Create apps/frontend (Next.js)
- Create prisma folder
- Initialize Git repository

---

## TASK 0.2 — Install Core Dependencies

### Backend:
- NestJS
- Prisma
- PostgreSQL driver
- bcrypt
- JWT
- Passport JWT

### Frontend:
- Next.js (App Router)
- TailwindCSS
- Axios

---

## TASK 0.3 — Setup Environment Files
- .env for backend
- .env.local for frontend
- database connection string
- JWT secret

---

# PHASE 1 — DATABASE LAYER

## TASK 1.1 — Setup Prisma Schema

Create tables:

- users
- profiles
- mentorship_pairs
- messages (optional)

---

## TASK 1.2 — Run Migrations
- Initialize PostgreSQL connection
- Run Prisma migrations
- Verify database connection

---

# PHASE 2 — AUTH SYSTEM

## TASK 2.1 — Create Auth Module

Implement:

- register endpoint
- login endpoint
- JWT token generation
- password hashing (bcrypt)

---

## TASK 2.2 — Authentication Flow Rules

- User registers → status = PENDING
- Admin must approve before login access
- Only APPROVED users can log in successfully

---

## TASK 2.3 — JWT Guard

- Protect all routes except auth routes
- Extract user from token
- Attach user to request object

---

# PHASE 3 — USER SYSTEM

## TASK 3.1 — Users Module

Create endpoints:

- GET /users/me
- GET /users/:id (admin only)

---

## TASK 3.2 — Profile Module

Create:

- profile creation
- profile update
- profile fetch

Fields:

- full_name
- rank
- specialization
- command_location
- mentor_type (ACTIVE / RETIRED)

---

# PHASE 4 — ADMIN SYSTEM (CRITICAL)

## TASK 4.1 — Admin Guard
- Restrict all admin routes
- Only role = ADMIN can access

---

## TASK 4.2 — Admin User Management

Endpoints:

- GET /admin/users/pending
- PATCH /admin/users/approve/:id
- PATCH /admin/users/reject/:id

---

## TASK 4.3 — Admin Mentor Assignment

Endpoint:

- POST /admin/pairs/assign

Logic:
- assign mentor to mentee manually
- create mentorship_pair record

---

# PHASE 5 — MENTOR MATCHING ENGINE

## TASK 5.1 — Simple Matching Algorithm

Implement scoring:

- specialization match (+3)
- rank closeness (+2)
- availability (+2)

Return top 5 mentors

---

## TASK 5.2 — Endpoint

- GET /matching/suggestions/:menteeId

---

# PHASE 6 — MENTORSHIP SYSTEM

## TASK 6.1 — Pairing System

Create:

- mentorship_pairs table logic
- assign mentor to mentee
- track status (ACTIVE, CLOSED)

---

## TASK 6.2 — Endpoints

- GET /pairs/me
- POST /pairs/create (admin only)

---

# PHASE 7 — FRONTEND (NEXT.JS)

## TASK 7.1 — App Structure

Create separate route groups:

- /mentee/*
- /mentor/*
- /admin/*

---

## TASK 7.2 — Mentee Dashboard

Features:
- view profile
- see assigned mentor
- view suggested mentors

---

## TASK 7.3 — Mentor Dashboard

Features:
- view assigned mentees
- accept/decline mentorship
- view mentee profiles

---

## TASK 7.4 — Admin Dashboard

Features:
- pending users list
- approve/reject users
- assign mentors
- view system overview

---

# PHASE 8 — BASIC MESSAGING (OPTIONAL BUT RECOMMENDED)

## TASK 8.1 — Messaging Table

Create messages table:

- sender_id
- pair_id
- message
- timestamp

---

## TASK 8.2 — Messaging API

- POST /messages/send
- GET /messages/:pairId

---

## TASK 8.3 — RULES

- Only users in same mentorship pair can chat
- No global messaging system

---

# PHASE 9 — SYSTEM VALIDATION

## TASK 9.1 — End-to-End Flow Test

Verify:

1. User registers
2. Admin approves user
3. Profile created
4. Mentor assigned
5. Mentee sees mentor
6. Messaging works

---

# SUCCESS CRITERIA (MANDATORY)

System is considered complete only if:

- Full user lifecycle works
- Admin can control system fully
- Mentorship pairing works
- Frontend dashboards are functional
- Backend APIs are stable

---

# FINAL RULE

If any feature is outside this list:
- DO NOT IMPLEMENT IT
- WAIT FOR NEXT PHASE INSTRUCTION

---

END OF TASK LIST