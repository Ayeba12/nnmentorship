# Project Plan: Redesign & Supabase Database Migration

This project plan details the technical roadmap for redesigning the Nigerian Navy Mentorship Platform by migrating from the current client-side mock-database implementation to a backend database backed by **Supabase**. We will transition the components, layouts, typography, and light-themed design system from the provided Vite codebase at `agon-agent_1-ce205c23` to Next.js 16 (App Router).

---

## Project Type
* **Type**: WEB
* **Primary Agent**: `frontend-specialist`
* **Primary Skill**: `frontend-design`

---

## Success Criteria
1. **Light-Themed Design System**: Overwrite the dark-mode layout with the source's professional navy/gold theme and typography.
2. **Supabase Local & Production Setup**: Database migration scripts generated locally, table schemas created from scratch, and RLS policies enforced.
3. **Database-Backed Core Modules**: Profiles, Mentorship request pipelines, relationship logging, availability calendars, and encrypted messages stored directly in Supabase.
4. **Content & Approvals Pipeline**: Admin approvals for courses, blog posts, and libraries fully integrated with Postgres tables.
5. **Quality Gate Compliance**: Clean compiler logs, lint checks, security scanning, and verify_all checklist passing.

---

## Tech Stack
* **Framework**: Next.js 16 (App Router)
* **Database**: Supabase (PostgreSQL with RLS and trigger-based audit logs)
* **Realtime Chat**: Supabase Realtime Channels (WebSockets)
* **Storage**: Supabase Storage Buckets (`discharge-documents` and `library-materials`)
* **Styling**: Tailwind CSS v4 (Light-theme navy/gold theme variables)
* **Icons**: Lucide React

---

## Proposed File Structure

```plaintext
.
├── app/
│   ├── api/                          # Next.js API Route Handlers (Supabase calls)
│   │   ├── admin/route.ts
│   │   ├── availability/route.ts
│   │   ├── blog/route.ts
│   │   ├── comments/route.ts
│   │   ├── courses/route.ts
│   │   ├── enrollments/route.ts
│   │   ├── goals/route.ts
│   │   ├── library/route.ts
│   │   ├── messages/route.ts
│   │   ├── profiles/route.ts
│   │   ├── relationships/route.ts
│   │   └── requests/route.ts
│   ├── auth/
│   │   ├── login/page.tsx            # Login Page
│   │   └── signup/page.tsx           # SignUp Page with role choosing & doc uploading
│   ├── dashboard/
│   │   └── page.tsx                  # Dynamic Dashboard (routes to views based on role metadata)
│   ├── mentors/
│   │   ├── page.tsx                  # Browse Mentors
│   │   └── [id]/page.tsx             # Mentor Detail Profile
│   ├── requests/page.tsx             # Mentorship Requests Page
│   ├── sessions/page.tsx             # Sessions & Availability manager
│   ├── goals/page.tsx                # Milestone Goals tracker
│   ├── messages/page.tsx             # Realtime Encrypted Chat
│   ├── courses/
│   │   ├── page.tsx                  # Courses Dashboard
│   │   └── [id]/page.tsx             # Course Detail & Lessons
│   ├── library/page.tsx              # Digital Library
│   ├── blog/
│   │   ├── page.tsx                  # Public Blog posts
│   │   └── [id]/page.tsx             # Single Blog post details
│   ├── admin/page.tsx                # Admin Dashboard (approvals, stats, logs)
│   ├── globals.css                   # Refactored stylesheet (light theme, Inter/Plus Jakarta)
│   └── layout.tsx                    # Layout with navigation wrapper & Supabase provider
├── components/
│   ├── ui.tsx                        # Core UI primitives (Buttons, Cards, Inputs, Modals)
│   └── Layout.tsx                    # Shared Sidebar, Header, Navigation
├── lib/
│   ├── supabase.ts                   # Supabase Client connection instance
│   └── encryption.ts                 # Message encryption/decryption utilities
├── supabase/
│   ├── migrations/                   # Local database schema & RLS rules
│   │   ├── 20260622000000_schema.sql
│   │   └── 20260622000001_rls_policies.sql
│   └── seed.sql                      # Seeding initial mocks for local development
```

---

## Task Breakdown

### Phase 1: Database Setup and Local Schema Provisioning

#### Task 1: Initialize local Supabase project and create schema migrations
* **Task ID**: `T1.1`
* **Agent**: `database-architect`
* **Skills**: `database-design`
* **Priority**: High
* **Dependencies**: None
* **Description**: Initialize Supabase locally. Generate PostgreSQL schema definitions in `supabase/migrations/20260622000000_schema.sql` including all 21 core tables (`profiles`, `mentorship_requests`, `mentorship_relationships`, `messages`, `sessions`, `goals`, `milestones`, `availability_slots`, `audit_logs`, `courses`, `lessons`, `quizzes`, `quiz_questions`, `enrollments`, `lesson_progress`, `certificates`, `blog_posts`, `blog_comments`, `library_items`, `reading_lists`, `reading_list_items`).
* **INPUT**: None
* **OUTPUT**: Initialized supabase config and migration script.
* **VERIFY**: Run `supabase start` and ensure the database spins up and applies the schema successfully.

#### Task 2: Implement Row Level Security (RLS) and seed initial database
* **Task ID**: `T1.2`
* **Agent**: `security-auditor`
* **Skills**: `vulnerability-scanner`, `database-design`
* **Priority**: High
* **Dependencies**: `T1.1`
* **Description**: Write security policies in `supabase/migrations/20260622000001_rls_policies.sql`. Mentees can query verified mentors. Active mentors can view requests and paired mentees. Retired mentors can ONLY view details of paired mentees. Admin bypasses all checks. Create `supabase/seed.sql` with mock data for mentors, mentees, and admin accounts to allow offline testing.
* **INPUT**: `supabase/migrations/20260622000000_schema.sql`
* **OUTPUT**: SQL rules and seed scripts.
* **VERIFY**: Query tables using guest vs. retired mentor accounts to assert that RLS filters out unauthorized rows.

---

### Phase 2: Design System & Shared Components

#### Task 3: Overwrite styling variables and typography
* **Task ID**: `T2.1`
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`
* **Priority**: High
* **Dependencies**: None
* **Description**: Replace the contents of `app/globals.css` with the light-theme navy/gold color system variables and imports from `agon-agent_1-ce205c23/src/index.css`.
* **INPUT**: `agon-agent_1-ce205c23/src/index.css`
* **OUTPUT**: Overwritten `app/globals.css`.
* **VERIFY**: Build styles and check that the global canvas background resolves to `#f6f8fb`.

#### Task 4: Port UI primitives and main layout navigation
* **Task ID**: `T2.2`
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`
* **Priority**: High
* **Dependencies**: `T2.1`
* **Description**: Create `components/ui.tsx` containing Buttons, Cards, Inputs, Modals, StatCards, ProgressBars. Create `components/Layout.tsx` for sidebars and headers.
* **INPUT**: `agon-agent_1-ce205c23/src/components/ui.tsx` and `Layout.tsx`
* **OUTPUT**: Reusable Next.js components.
* **VERIFY**: View component file imports and ensure they are React 19/Next 16 compatible.

---

### Phase 3: Auth Pages Migration

#### Task 5: Implement Login and Registration pages
* **Task ID**: `T3.1`
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`
* **Priority**: High
* **Dependencies**: `T2.2`
* **Description**: Port the screens to `app/auth/login/page.tsx` and `app/auth/signup/page.tsx`. Integrate with `supabase.auth.signInWithPassword` and `signUp`. Sign-up form will let users specify their mentorship roles and service numbers. Uploaded discharge credentials will go to `discharge-documents` bucket in Supabase storage.
* **INPUT**: `agon-agent_1-ce205c23/src/pages/Login.tsx` and `Signup.tsx`
* **OUTPUT**: Working auth routes.
* **VERIFY**: Register a new pending account, confirm the record appears in `auth.users` and `profiles` tables, and discharge papers save in Storage.

---

### Phase 4: Core Mentorship Functionality

#### Task 6: Implement Next.js API route handlers
* **Task ID**: `T4.1`
* **Agent**: `backend-specialist`
* **Skills**: `api-patterns`
* **Priority**: High
* **Dependencies**: `T1.2`
* **Description**: Create route handlers (`app/api/profiles/route.ts`, `/requests/`, `/relationships/`, etc.) that query Supabase tables. Incorporate authorization middleware validating the JWT token bearer headers.
* **INPUT**: `agon-agent_1-ce205c23/api` serverless files
* **OUTPUT**: Core REST endpoints.
* **VERIFY**: Test GET/POST actions on `/api/profiles` using a REST client and assert output schema.

#### Task 7: Implement Dynamic Dashboard and Find Mentors pages
* **Task ID**: `T4.2`
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`
* **Priority**: Medium
* **Dependencies**: `T3.1`, `T4.1`
* **Description**: Create `app/dashboard/page.tsx` displaying widgets according to the signed-in user's role. Port `FindMentor.tsx` to `app/mentors/page.tsx` and detail page to `app/mentors/[id]/page.tsx` utilizing client-side matching algorithms.
* **INPUT**: `agon-agent_1-ce205c23/src/pages/Dashboard.tsx`, `FindMentor.tsx`, and `MentorDetail.tsx`
* **OUTPUT**: Completed dashboard layout and search profiles.
* **VERIFY**: Sign in as a mentee and review the suggested matches card, click a profile and check description.

#### Task 8: Port scheduling, milestones tracking and encrypted chat
* **Task ID**: `T4.3`
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`, `clean-code`
* **Priority**: Medium
* **Dependencies**: `T4.2`
* **Description**: Port `Sessions.tsx`, `Goals.tsx`, and `Messages.tsx`. Set up Supabase Realtime client listener inside `app/messages/page.tsx` to subscribe to messages. Build `/lib/encryption.ts` using `crypto` standard to decrypt messages on client query and encrypt on post actions.
* **INPUT**: `agon-agent_1-ce205c23/src/pages/Sessions.tsx`, `Goals.tsx`, and `Messages.tsx`
* **OUTPUT**: Realtime chat, session scheduling, and milestone checkers.
* **VERIFY**: Send a message from a mentee session, check that it saves encrypted in the table, and decrypts instantly on the mentor dashboard.

---

### Phase 5: Learning Modules, Library, and Admin approvals

#### Task 9: Migrate Courses and Library modules
* **Task ID**: `T5.1`
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`
* **Priority**: Medium
* **Dependencies**: `T4.2`
* **Description**: Port public modules: blog, reading resources list, digital library catalog search, and course viewer/quiz takers. Set up SVG course certificate renderer downloading completed achievements.
* **INPUT**: `agon-agent_1-ce205c23/src/pages/Courses.tsx`, `Library.tsx`, `Blog.tsx`
* **OUTPUT**: Library download lists and interactive courses.
* **VERIFY**: Complete a course lesson quiz, check that the enrollment state updates to `completed`, and download the certificate.

#### Task 10: Port Admin Approval dashboard
* **Task ID**: `T5.2`
* **Agent**: `frontend-specialist`
* **Skills**: `frontend-design`
* **Priority**: Medium
* **Dependencies**: `T4.2`
* **Description**: Port `AdminDashboard.tsx` to `app/admin/page.tsx`. Admin can audit requests, oversee pairs, approve pending user roles, and toggle content approvals.
* **INPUT**: `agon-agent_1-ce205c23/src/pages/AdminDashboard.tsx`
* **OUTPUT**: Fully populated Admin dashboard view.
* **VERIFY**: Vett a document from the queue, click verify, and check that the user profile status updates to `verified` in Postgres.

---

## Phase X: Verification Checklist

### Verification Commands
```bash
# 1. Run typescript verification and eslint
npm run lint && npx tsc --noEmit

# 2. Run security scans
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .

# 3. Check for any UX/design discrepancies
python .agent/skills/frontend-design/scripts/ux_audit.py .

# 4. Build application to check bundling
npm run build
```

### Manual Checks
- [ ] Colors match the light-themed navy/gold palette exactly.
- [ ] No purple/violet color hex codes.
- [ ] Local Supabase Docker starts and imports the seed database.
- [ ] Authentication guards block access to pages if user has no valid session.
- [ ] RLS policies prevent retired mentors from accessing external personnel rows.
- [ ] Chat messages are saved encrypted in the database.
- [ ] Courses and certificate downloads function as expected.
- [ ] `checklist.py` returns success.

---

## ✅ PHASE X COMPLETE
- Lint: [Pending]
- Security: [Pending]
- Build: [Pending]
- Date: [Pending]
