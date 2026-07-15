-- ===========================================================================
-- Enable Row Level Security (RLS) on all tables
-- ===========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- SECURITY DEFINER helper functions (bypass RLS to avoid infinite recursion)
-- ===========================================================================

-- Helper: Check if the current user is an admin.
-- SECURITY DEFINER runs as the function owner, bypassing RLS on profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: Get the current user's profile ID.
-- SECURITY DEFINER runs as the function owner, bypassing RLS on profiles.
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles
  WHERE auth_id = auth.uid()
  LIMIT 1;
$$;

-- Restrict execution to authenticated users only
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_profile_id() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated;


-- ===========================================================================
-- PROFILES POLICIES
-- ===========================================================================

-- 1. SELECT: Users can view their own profile, verified mentors, paired profiles, or admins see all.
CREATE POLICY select_profiles ON public.profiles FOR SELECT
USING (
    -- Own profile (direct column check, no subquery = no recursion)
    auth_id = auth.uid()
    -- Verified mentors are publicly visible
    OR (role IN ('active_mentor', 'retired_mentor') AND verification_status = 'verified')
    -- Admin sees all (uses SECURITY DEFINER function, no recursion)
    OR public.is_admin()
    -- Users in a mentorship relationship can see each other
    OR EXISTS (
        SELECT 1 FROM public.mentorship_relationships r
        WHERE (r.mentor_id = profiles.id OR r.mentee_id = profiles.id)
          AND (r.mentor_id = public.get_my_profile_id() OR r.mentee_id = public.get_my_profile_id())
    )
    -- Users involved in a pending request can see each other
    OR EXISTS (
        SELECT 1 FROM public.mentorship_requests req
        WHERE (req.mentor_id = profiles.id OR req.mentee_id = profiles.id)
          AND (req.mentor_id = public.get_my_profile_id() OR req.mentee_id = public.get_my_profile_id())
    )
);

-- 2. INSERT: Users can create their own profiles
CREATE POLICY insert_own_profile ON public.profiles FOR INSERT
WITH CHECK (auth_id = auth.uid());

-- 3. UPDATE: Users can modify their own profiles, admins can modify all
CREATE POLICY update_own_profile ON public.profiles FOR UPDATE
USING (auth_id = auth.uid() OR public.is_admin())
WITH CHECK (auth_id = auth.uid() OR public.is_admin());

-- 4. DELETE: Only admins can delete profiles
CREATE POLICY admin_delete_profiles ON public.profiles FOR DELETE
USING (public.is_admin());


-- ===========================================================================
-- MENTORSHIP REQUESTS POLICIES
-- ===========================================================================

-- SELECT: Mentees/Mentors involved in requests or Admins
CREATE POLICY select_requests ON public.mentorship_requests FOR SELECT
USING (
    mentee_id = public.get_my_profile_id()
    OR mentor_id = public.get_my_profile_id()
    OR public.is_admin()
);

-- INSERT: Mentees can submit requests
CREATE POLICY insert_requests ON public.mentorship_requests FOR INSERT
WITH CHECK (
    mentee_id = public.get_my_profile_id()
);

-- UPDATE: Mentors can update requests (e.g. accept/decline) or Admins
CREATE POLICY update_requests ON public.mentorship_requests FOR UPDATE
USING (
    mentor_id = public.get_my_profile_id()
    OR public.is_admin()
);

-- ===========================================================================
-- MENTORSHIP RELATIONSHIPS POLICIES
-- ===========================================================================

-- SELECT: Mentees/Mentors involved or Admins
CREATE POLICY select_relationships ON public.mentorship_relationships FOR SELECT
USING (
    mentee_id = public.get_my_profile_id()
    OR mentor_id = public.get_my_profile_id()
    OR public.is_admin()
);

-- INSERT/UPDATE/DELETE: Managed by Admin or via backend triggers (service role bypasses RLS)
CREATE POLICY manage_relationships ON public.mentorship_relationships FOR ALL
USING (public.is_admin());

-- ===========================================================================
-- MESSAGES POLICIES
-- ===========================================================================

-- ALL: Mentees/Mentors involved in the active relationship
CREATE POLICY access_messages ON public.messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.mentorship_relationships r
        WHERE r.id = messages.relationship_id
          AND (r.mentee_id = public.get_my_profile_id() OR r.mentor_id = public.get_my_profile_id())
    )
);

-- ===========================================================================
-- SESSIONS POLICIES
-- ===========================================================================

-- ALL: Mentees/Mentors involved in the relationship, or Admins
CREATE POLICY access_sessions ON public.sessions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.mentorship_relationships r
        WHERE r.id = sessions.relationship_id
          AND (r.mentee_id = public.get_my_profile_id() OR r.mentor_id = public.get_my_profile_id())
    )
    OR public.is_admin()
);

-- ===========================================================================
-- GOALS & MILESTONES POLICIES
-- ===========================================================================

-- ALL: Mentees/Mentors involved in the relationship, or Admins
CREATE POLICY access_goals ON public.goals FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.mentorship_relationships r
        WHERE r.id = goals.relationship_id
          AND (r.mentee_id = public.get_my_profile_id() OR r.mentor_id = public.get_my_profile_id())
    )
    OR public.is_admin()
);

-- ALL: Mentees/Mentors involved in the relationship, or Admins
CREATE POLICY access_milestones ON public.milestones FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.goals g
        JOIN public.mentorship_relationships r ON r.id = g.relationship_id
        WHERE g.id = milestones.goal_id
          AND (r.mentee_id = public.get_my_profile_id() OR r.mentor_id = public.get_my_profile_id())
    )
    OR public.is_admin()
);

-- ===========================================================================
-- AVAILABILITY SLOTS POLICIES
-- ===========================================================================

-- SELECT: Anyone can view slots
CREATE POLICY view_slots ON public.availability_slots FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE: Only the mentor themselves
CREATE POLICY manage_slots ON public.availability_slots FOR ALL
USING (
    mentor_id = public.get_my_profile_id()
);

-- ===========================================================================
-- AUDIT LOGS POLICIES
-- ===========================================================================

-- SELECT: Only Admins
CREATE POLICY view_audit ON public.audit_logs FOR SELECT
USING (public.is_admin());

-- INSERT: Authenticated users can insert log rows
CREATE POLICY insert_audit ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
