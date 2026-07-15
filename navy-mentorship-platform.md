# Nigerian Navy Mentorship Platform Plan

## Overview
This plan outlines the technical design, directory architecture, and task breakdown for building the Nigerian Navy Mentorship Platform. The project features a public-facing website, a unified authentication/registration portal with role-specific entry, isolated role-based dashboards, a system-wide light/dark theme switcher, and a modular **Content Contributor** permission system. Content creation (blog posts, courses, books) is accessible to senior roles (Active Mentors, Retired Mentors, Admins) and submitted for Admin approval. The application leverages a simulated client-side database layer (`MockDatabase`) persisted in `localStorage`.

---

## Project Type
- **Type**: WEB
- **Primary Agent**: `frontend-specialist`
- **Primary Skill**: `frontend-design`

---

## Success Criteria
1. **Public Website**: Includes a fully interactive home landing page, public blog module, and a digital library catalog.
2. **Unified Auth Page**: Login and registration screens tailored for Mentees, Active Mentors, Retired Mentors, and Administrators, with verification document uploads for veterans.
3. **Strict Dashboard Isolation**: Distinct dashboard interfaces for Mentees, Active Mentors, Retired Mentors, and Administrators.
4. **Content Contributor System**: Permission dynamically added to senior roles (Mentors & Admins) letting them create blog posts, submit courses, and upload books (subject to Admin approval before publishing).
5. **Theme Customization**: Responsive theme toggle supporting both a sleek Linear-inspired dark mode and a professional light mode.
6. **Session Scheduling & Messaging**: Interactive messaging and calendar booking simulators.
7. **Certificate Generator**: SVG-based client-side course completion certificate generator.
8. **Quality Check**: Clear linting, type-safety, and performance metrics checked via checklist scripts.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (configured with light/dark variables based on navy command blue accent `#0B3D5C`)
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage (via `domain/MockDatabase.ts`)

---

## Proposed File Structure

```plaintext
.
├── app/
│   ├── globals.css                # Global CSS with light/dark theme variables
│   ├── layout.tsx                 # Root layout with theme provider context
│   ├── page.tsx                   # Public Home Page
│   ├── blog/
│   │   └── page.tsx               # Public Blog view (read articles)
│   ├── library/
│   │   └── page.tsx               # Public Digital Library catalog & search
│   ├── auth/
│   │   └── page.tsx               # Auth Page (Login / SignUp, role chooser, doc upload)
│   └── dashboard/
│       ├── mentee/
│       │   └── page.tsx           # Mentee Dashboard
│       ├── mentor-active/
│       │   └── page.tsx           # Active Mentor Dashboard (includes Content Portal)
│       ├── mentor-retired/
│       │   └── page.tsx           # Retired Mentor Dashboard (includes Content Portal)
│       └── admin/
│           └── page.tsx           # Admin Panel (vetting queue, matching override, content approval)
├── domain/
│   ├── MatchingEngine.ts          # Core matching scoring engine
│   └── MockDatabase.ts            # Persistent LocalStorage database (users, pairs, courses, blog)
├── components/
│   ├── ThemeToggle.tsx            # Floating light/dark mode theme selector
│   ├── Navigation.tsx             # Shared header navbar with routing & theme control
│   └── RegistrationForm.tsx       # Auth signup component
```

---

## Theme Specs

| Token | Dark Mode | Light Mode |
| :--- | :--- | :--- |
| `--color-primary` | `#0B3D5C` (Naval Command Blue) | `#0B3D5C` (Naval Command Blue) |
| `--color-canvas` | `#010102` | `#ffffff` |
| `--color-surface-1` | `#0f1011` | `#f5f6f6` |
| `--color-surface-2` | `#141516` | `#f6f7f7` |
| `--color-hairline` | `#23252a` | `#e2e8f0` |
| `--color-ink` | `#f7f8f8` | `#000000` |
| `--color-ink-muted` | `#d0d6e0` | `#4a5568` |
| `--color-ink-subtle` | `#8a8f98` | `#718096` |

---

## Task Breakdown

### Phase 1: Authentication, Theme Switcher & Public Pages

#### Task 1: Refactor Mock Database Schema & Core Data Model
- **Task ID**: `T1.1`
- **Agent**: `database-architect`
- **Skills**: `database-design`
- **Priority**: High
- **Dependencies**: None
- **Description**: Expand `domain/MockDatabase.ts` to support:
  - Role-specific database entries for `MENTOR_RETIRED` with tighter data visibilities.
  - Vetting queue statuses and uploaded document storage (base64 or mockup references).
  - Public blog posts catalog, courses library, and digital library assets.
  - Approval queue statuses (`PENDING`, `APPROVED`, `REJECTED`) for blog posts, courses, and books created by Content Contributors.
- **INPUT**: `domain/MockDatabase.ts`
- **OUTPUT**: Upgraded mock database file.
- **VERIFY**: Check TypeScript compile checks for all database objects.

#### Task 2: Implement Theme Switcher & Global Styles
- **Task ID**: `T1.2`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: High
- **Dependencies**: None
- **Description**: Setup theme provider in `app/layout.tsx` and refactor `app/globals.css` to toggle between light and dark modes based on `.light` or `.dark` class selectors on the root document. Add `components/ThemeToggle.tsx`.
- **INPUT**: `app/globals.css`, `app/layout.tsx`
- **OUTPUT**: Dynamic light/dark styling system.
- **VERIFY**: Switch themes manually using the toggle button and verify that all surfaces, borders, and text colors transition perfectly.

#### Task 3: Build Public Pages & Main Navigation
- **Task ID**: `T1.3`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: High
- **Dependencies**: `T1.2`
- **Description**: Build:
  - `app/page.tsx`: Landing page highlighting mentorship features, testimonials, and active metrics.
  - `app/blog/page.tsx`: Reading section for published posts.
  - `app/library/page.tsx`: Public digital library search engine.
  - `components/Navigation.tsx`: Shared navbar.
- **INPUT**: Public routing folder setup.
- **OUTPUT**: Functional public pages and navbar links.
- **VERIFY**: Navigate between `/`, `/blog`, and `/library` on a browser.

#### Task 4: Unified Auth Portal (Login / Registration)
- **Task ID**: `T1.4`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: High
- **Dependencies**: `T1.1`
- **Description**: Build `app/auth/page.tsx`:
  - Login & Register views.
  - Role picker (Mentee, Active Mentor, Retired Mentor, Admin).
  - Vetting uploads for Retired Mentors.
- **INPUT**: `app/auth/page.tsx`
- **OUTPUT**: Complete authentication interface.
- **VERIFY**: Create a new account, check local storage data updates, and assert redirection based on role.

---

### Phase 2: Role-Isolated Dashboards

#### Task 5: Mentee Dashboard View
- **Task ID**: `T2.1`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: Medium
- **Dependencies**: `T1.4`
- **Description**: Design `app/dashboard/mentee/page.tsx` containing:
  - Interactive matching request engine (browse suggestions, send requests).
  - Active Chat interface (WebSocket mock) and Calendar booking.
  - Course center and SVG completion certificates download.
- **INPUT**: `app/dashboard/mentee/page.tsx`
- **OUTPUT**: Complete Mentee view.
- **VERIFY**: Log in as a Mentee, click a mentor request, book a mock meeting, and review logs.

#### Task 6: Active Mentor Dashboard View
- **Task ID**: `T2.2`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: Medium
- **Dependencies**: `T2.1`
- **Description**: Design `app/dashboard/mentor-active/page.tsx` containing:
  - Requests queue: accept or reject mentee pairing requests.
  - Active mentorships: chat, scheduling organizer, and goals checklist tracker.
  - Content Contribution tab: write and submit blog posts, upload books/courses (subject to Admin approval).
- **INPUT**: `app/dashboard/mentor-active/page.tsx`
- **OUTPUT**: Complete Active Mentor view.
- **VERIFY**: Log in as Active Mentor, accept a pending mentee, set a goal, and check matching state.

#### Task 7: Retired Mentor Dashboard View (Tighter Data Visibility)
- **Task ID**: `T2.3`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: Medium
- **Dependencies**: `T2.2`
- **Description**: Design `app/dashboard/mentor-retired/page.tsx`:
  - Inherits mentorship tools and Content Contribution options of active mentors, but enforces tighter security data access (can only view mentee's military profile data once paired, cannot see active naval location or deployment databases).
  - Vetting status header (prominently displays if their veteran status is pending validation).
- **INPUT**: `app/dashboard/mentor-retired/page.tsx`
- **OUTPUT**: Secured Retired Mentor view.
- **VERIFY**: Ensure navigation to retired dashboard checks role restriction and logs warnings for unauthorized view models.

#### Task 8: Administrator Panel Dashboard (Vetting, Overrides & Content Approval)
- **Task ID**: `T2.4`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: Medium
- **Dependencies**: `T1.4`
- **Description**: Design `app/dashboard/admin/page.tsx`:
  - Active list of all personnel and pairings.
  - Vetting queue for pending registrations (focusing on veteran document verification review).
  - Content Approval queue: approve/decline blog posts, courses, or library books submitted by mentors before publishing.
  - Manual overrides to bypass matching engine algorithms.
  - Analytics and audit logging panel.
- **INPUT**: `app/dashboard/admin/page.tsx`
- **OUTPUT**: Upgraded Admin panel.
- **VERIFY**: Vett an uploaded discharge document or approve a new course submission, approve account, check audit logs.

---

### Phase 3: Certification, Polish & Verification

#### Task 9: SVG Course Certificate Generator
- **Task ID**: `T3.1`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: Low
- **Dependencies**: `T2.1`
- **Description**: Standardized SVG document containing Navy insignia, student name, and dean signature. Triggers immediate client-side `.svg` download.
- **INPUT**: Helper code implementation.
- **OUTPUT**: SVG export utility.
- **VERIFY**: Complete a course as a mentee, download, and open certificate in vector reader.

#### Task 10: Run Build & Verification Checklist (Phase X)
- **Task ID**: `T3.2`
- **Agent**: `performance-optimizer`
- **Skills**: `lint-and-validate`
- **Priority**: High
- **Dependencies**: All preceding tasks
- **Description**: Run linters, compiler, and project validation script (`python .agent/scripts/checklist.py .`). Fix color and accessibility contrasts for both dark and light modes.
- **INPUT**: Core workspace directories.
- **OUTPUT**: Successful build checks.
- **VERIFY**: Verify compile logs return no critical warnings or failures.

---

## Phase X: Verification Checklist
- [ ] No purple/violet color hex codes.
- [ ] Light & dark mode contrasts pass WCAG AA standards.
- [ ] Authentication guards block page switches without appropriate roles.
- [ ] Veteran vetting document upload functional in registration.
- [ ] Content creation by contributors (mentors/admins) flows to Admin approval queue before appearing in public blogs/courses/library.
- [ ] Admins can manually pair or override matches.
- [ ] System audit logs trace approvals, pairing changes, and downloads.
- [ ] Course certificate download operates.
- [ ] `npm run build` succeeds without warnings.
- [ ] `python .agent/scripts/checklist.py .` returns a pass.
