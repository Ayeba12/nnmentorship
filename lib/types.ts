export type UserRole = 'mentee' | 'active_mentor' | 'retired_mentor' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: number;
  email: string;
  auth_id: string | null;
  full_name: string;
  role: UserRole;
  is_content_contributor: boolean;
  can_manage_blog?: boolean;
  can_manage_courses?: boolean;
  can_manage_library?: boolean;
  verification_status: VerificationStatus;
  service_number: string | null;
  service_branch: string;
  specialization: string;
  rank: string;
  years_of_service: number;
  command_location: string;
  career_goals: string;
  mentorship_interests: string;
  bio: string;
  avatar_url: string | null;
  additional_pictures: string[] | null;
  last_rank_held: string | null;
  years_served: number | null;
  years_since_retirement: number | null;
  civilian_role: string | null;
  civilian_industry: string | null;
  is_accepting_mentees: boolean;
  max_mentees: number;
  created_at: string;
  updated_at: string;
}

export interface MentorshipRequest {
  id: number;
  mentee_id: number;
  mentor_id: number;
  request_type: 'mentee_choice' | 'auto_assign' | 'admin_review';
  status: 'pending' | 'accepted' | 'declined' | 'admin_pending';
  message: string;
  match_score: number | null;
  assigned_by: number | null;
  created_at: string;
  responded_at: string | null;
  mentee?: Profile;
  mentor?: Profile;
}

export interface Relationship {
  id: number;
  mentee_id: number;
  mentor_id: number;
  status: 'active' | 'ended' | 'paused';
  started_at: string;
  ended_at: string | null;
  end_reason: string | null;
  notes: string | null;
  mentee?: Profile;
  mentor?: Profile;
}

export interface Message {
  id: number;
  relationship_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read_at: string | null;
  sender?: Pick<Profile, 'id' | 'full_name' | 'role' | 'rank' | 'avatar_url'>;
}

export interface Session {
  id: number;
  relationship_id: number;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'pending_confirmation';
  session_type: 'booked_slot' | 'proposed_time';
  notes: string | null;
  goals_set: string | null;
  progress_recorded: string | null;
  created_at: string;
  completed_at: string | null;
  relationship?: {
    id: number;
    mentee_id: number;
    mentor_id: number;
    mentee?: Pick<Profile, 'id' | 'full_name' | 'rank' | 'avatar_url'>;
    mentor?: Pick<Profile, 'id' | 'full_name' | 'rank' | 'avatar_url'>;
  };
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  type: 'checkbox' | 'choice' | 'note';
  value?: 'yes' | 'no' | null | string;
  optional?: boolean;
}

export interface Milestone {
  id: number;
  goal_id: number;
  title: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  subtasks?: SubTask[];
}

export interface Goal {
  id: number;
  mentee_id: number;
  mentor_id: number;
  relationship_id: number;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'abandoned';
  target_date: string | null;
  created_at: string;
  completed_at: string | null;
  milestones?: Milestone[];
}

export interface AvailabilitySlot {
  id: number;
  mentor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date: string | null;
  is_booked: boolean;
}

export interface AuditLog {
  id: number;
  actor_id: number;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
  actor?: Pick<Profile, 'id' | 'full_name' | 'role'>;
}

export interface MatchFactor {
  label: string;
  value: number;
  max: number;
  detail: string;
}

export interface MatchResult {
  score: number;
  maxScore: number;
  percentage: number;
  tier: string;
  factors: MatchFactor[];
  reasons: string[];
}

export interface MatchedMentor extends Profile {
  match: MatchResult;
}

export interface AdminStats {
  total_users: number;
  active_relationships: number;
  pending_verifications: number;
  sessions_this_month: number;
  total_mentors: number;
  total_mentees: number;
}

export interface AdminReports {
  match_rate: number;
  total_matches: number;
  active_relationships: number;
  sessions_completed: number;
  goal_completion: number;
  total_goals: number;
  completed_goals: number;
  retention_rate: number;
  long_term_relationships: number;
  all_relationships: (Relationship & { mentee?: { full_name: string }; mentor?: { full_name: string } })[];
}

export interface AppEvent {
  id: number;
  title: string;
  description: string;
  event_type: 'online' | 'offline' | 'podcast';
  visibility: 'public' | 'private';
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  meeting_link: string | null;
  audio_url: string | null;
  external_link: string | null;
  created_by: number | null;
  created_at: string;
  registrations?: EventRegistration[];
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id: number | null;
  guest_name: string | null;
  guest_email: string | null;
  status: 'attending' | 'interested';
  created_at: string;
  user?: Pick<Profile, 'id' | 'full_name' | 'email' | 'role' | 'rank' | 'avatar_url'>;
}
