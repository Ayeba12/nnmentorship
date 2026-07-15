# PLAN-navy-mentorship.md — Nigerian Navy Mentorship Platform Demo

Detailed implementation plan for building the client-facing interactive unified Next.js demo of the Nigerian Navy Mentorship Platform.

## 1. Goal Description
Create a premium, dark-themed Next.js demonstration application for the Nigerian Navy Mentorship Platform to showcase the workflows of Mentees, Mentors, and Administrators, as well as the mathematical matching engine.

## 2. User Review Required
We are implementing a unified single-page application with a role switcher header. The color theme is based on `DESIGN-navy-color-system.md` (near-black canvas `#010102` with Naval Command Blue `#0B3D5C` as accent).

## 3. Technical Architecture & Data Models
The application will run entirely in the browser using React state and `localStorage` to simulate a real-time database with the following entities:
- **Users**: Navy ID, Full Name, Email, Rank (e.g., Sub-Lieutenant, Commander, Rear Admiral), Active Duty Status, Specialization (e.g., Navigation, Engineering, Logistics, Operations), Command (e.g., Western Naval Command, Eastern Naval Command), Biography, and Role (MENTEE, MENTOR, ADMIN).
- **Mentorship Pairs**: ID, Mentee ID, Mentor ID, Match Score, Match Reason, Status (PENDING, ACTIVE, COMPLETED).
- **Sessions**: ID, Pair ID, Date/Time, Status (SCHEDULED, COMPLETED, CANCELLED), Goals Addressed.
- **Messages**: ID, Pair ID, Sender ID, Content, Timestamp.
- **Goals**: ID, Pair ID, Title, Status (PENDING, IN_PROGRESS, COMPLETED).
- **Audit Logs**: ID, Action (e.g., "USER_APPROVAL", "MATCH_CREATED"), Timestamp, Performed By.

## 4. UI/UX Layout & Navigation
- **Top Navigation Bar**: Floating layout, glassmorphism panel. Left: Naval insignia and title. Center: Role Switcher tabs (`Mentee Dashboard`, `Mentor Dashboard`, `Admin Panel`). Right: Active User status chip.
- **Mentee Dashboard**:
  - *Browse Mentors*: Card grid of available mentors showing their ranks, specialization, and calculated compatibility score.
  - *Interactive Match Calculator*: Slider section where user can customize attributes (e.g., change rank gap, same command, specialization match) to see the score update in real-time.
  - *Active Mentorship*: If matched, displays mentor details, goal checklist, session scheduler, and a messaging window.
- **Mentor Dashboard**:
  - *Incoming Requests*: List of pending match requests with action buttons (Accept / Decline).
  - *Mentees List*: Detailed view of current mentees, their active goals, and session schedules.
  - *Mentor Chat*: Conversation screen with active mentees.
- **Admin Panel**:
  - *User Management*: List of pending personnel signups requiring admin approval (Approve/Reject actions).
  - *Audit Logs*: Live timeline list of system activity logs.
  - *System Statistics*: Overview of matches, active pairs, and success rates.

## 5. Matching Engine Mathematical Formula
The Matching Engine will calculate compatibility using the formula:
$$\text{Score} = (\text{Specialization Match} \times 4) + (\text{Rank Gap Match} \times 3) + (\text{Command Match} \times 2) + (\text{Availability Match} \times 3) + (\text{History Match} \times 2)$$

- **Specialization Match** (0 or 10): 10 if both have same specialization.
- **Rank Gap Match** (0 to 10): Calculated as $10 - (\text{mentor\_rank\_index} - \text{mentee\_rank\_index})$ (preferring a 1-to-3 rank difference; if rank difference is negative or too large, score decreases).
- **Command Match** (0 or 10): 10 if in same command (preferring regional proximity).
- **Availability Match** (0 to 10): Mocked schedule compatibility rating.
- **History Match** (0 or 10): 10 if mentor has high past matching rating.

## 6. Implementation Milestones
1. **Milestone 1**: Initialize Next.js, configure Tailwind variables, install Lucide Icons.
2. **Milestone 2**: Build local storage mock database and matching algorithm engine.
3. **Milestone 3**: Implement Top Navigation and Role Switcher.
4. **Milestone 4**: Build the Admin Panel (user approvals & logs).
5. **Milestone 5**: Build the Mentee and Mentor dashboards (messaging, goals, requests).
6. **Milestone 6**: Build the Interactive Match Calculator.
7. **Milestone 7**: Linting, styling audits, and build validation.

## 7. Verification Plan
- **Automated**: Run `npm run lint` and `npm run build`.
- **Manual**: Test interactions across all 3 roles, verify chat messaging simulation, check color system contrast ratios and responsiveness.
