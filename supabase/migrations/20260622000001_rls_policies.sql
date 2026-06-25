-- Enable Row Level Security (RLS) on all tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES POLICIES ====================

-- 1. SELECT: Users can view verified mentors, their own profiles, or related profiles (paired). Admins can view all.
CREATE POLICY select_profiles ON public.profiles FOR SELECT
USING (
    auth_id = auth.uid()
    OR (role IN ('active_mentor', 'retired_mentor') AND verification_status = 'verified')
    OR EXISTS (
        SELECT 1 FROM public.profiles admin_p
        WHERE admin_p.auth_id = auth.uid() AND admin_p.role = 'admin'
    )
    OR EXISTS (
        SELECT 1 FROM public.mentorship_relationships r
        JOIN public.profiles p1 ON p1.id = r.mentor_id
        JOIN public.profiles p2 ON p2.id = r.mentee_id
        WHERE (p1.auth_id = auth.uid() OR p2.auth_id = auth.uid())
          AND (profiles.id = r.mentor_id OR profiles.id = r.mentee_id)
    )
    OR EXISTS (
        SELECT 1 FROM public.mentorship_requests req
        JOIN public.profiles p1 ON p1.id = req.mentor_id
        JOIN public.profiles p2 ON p2.id = req.mentee_id
        WHERE (p1.auth_id = auth.uid() OR p2.auth_id = auth.uid())
          AND (profiles.id = req.mentor_id OR profiles.id = req.mentee_id)
    )
);

-- 2. INSERT: Users can create their own profiles
CREATE POLICY insert_own_profile ON public.profiles FOR INSERT
WITH CHECK (auth_id = auth.uid());

-- 3. UPDATE: Users can modify their own profiles
CREATE POLICY update_own_profile ON public.profiles FOR UPDATE
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- 4. ADMIN: Full access to profiles
CREATE POLICY admin_all_profiles ON public.profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_id = auth.uid() AND role = 'admin'
    )
);

-- ==================== MENTORSHIP REQUESTS POLICIES ====================

-- SELECT: Mentees/Mentors involved in requests or Admins
CREATE POLICY select_requests ON public.mentorship_requests FOR SELECT
USING (
    mentee_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR mentor_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- INSERT: Mentees can submit requests
CREATE POLICY insert_requests ON public.mentorship_requests FOR INSERT
WITH CHECK (
    mentee_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
);

-- UPDATE: Mentors can update requests (e.g. accept/decline) or Admins
CREATE POLICY update_requests ON public.mentorship_requests FOR UPDATE
USING (
    mentor_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ==================== MENTORSHIP RELATIONSHIPS POLICIES ====================

-- SELECT: Mentees/Mentors involved or Admins
CREATE POLICY select_relationships ON public.mentorship_relationships FOR SELECT
USING (
    mentee_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR mentor_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- INSERT/UPDATE/DELETE: Managed by Admin or via backend triggers (service role bypasses RLS)
CREATE POLICY manage_relationships ON public.mentorship_relationships FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ==================== MESSAGES POLICIES ====================

-- ALL: Mentees/Mentors involved in the active relationship
CREATE POLICY access_messages ON public.messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.mentorship_relationships r
        WHERE r.id = messages.relationship_id
          AND (
              r.mentee_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
              OR r.mentor_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
          )
    )
);

-- ==================== SESSIONS POLICIES ====================

-- ALL: Mentees/Mentors involved in the relationship, or Admins
CREATE POLICY access_sessions ON public.sessions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.mentorship_relationships r
        WHERE r.id = sessions.relationship_id
          AND (
              r.mentee_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
              OR r.mentor_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
          )
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ==================== GOALS & MILESTONES POLICIES ====================

-- ALL: Mentees/Mentors involved in the relationship, or Admins
CREATE POLICY access_goals ON public.goals FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.mentorship_relationships r
        WHERE r.id = goals.relationship_id
          AND (
              r.mentee_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
              OR r.mentor_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
          )
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ALL: Mentees/Mentors involved in the relationship, or Admins
CREATE POLICY access_milestones ON public.milestones FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.goals g
        JOIN public.mentorship_relationships r ON r.id = g.relationship_id
        WHERE g.id = milestones.goal_id
          AND (
              r.mentee_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
              OR r.mentor_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
          )
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ==================== AVAILABILITY SLOTS POLICIES ====================

-- SELECT: Anyone can view slots
CREATE POLICY view_slots ON public.availability_slots FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE: Only the mentor themselves
CREATE POLICY manage_slots ON public.availability_slots FOR ALL
USING (
    mentor_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
);

-- ==================== AUDIT LOGS POLICIES ====================

-- SELECT: Only Admins
CREATE POLICY view_audit ON public.audit_logs FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- INSERT: Authenticated users can insert log rows
CREATE POLICY insert_audit ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
