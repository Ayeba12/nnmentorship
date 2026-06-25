import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireProfile } from '@/lib/api-helpers';

function scoreMatch(mentee: any, mentor: any) {
  const factors = [];
  let score = 0;
  let maxScore = 0;

  // 1. Specialization match (max 30)
  maxScore += 30;
  if (mentee.specialization && mentor.specialization) {
    const mSpec = mentee.specialization.toLowerCase();
    const tSpec = mentor.specialization.toLowerCase();
    if (mSpec === tSpec) {
      score += 30;
      factors.push({ label: 'Specialization', value: 30, max: 30, detail: `Exact match: ${mentor.specialization}` });
    } else if (mSpec.includes(tSpec) || tSpec.includes(mSpec)) {
      score += 20;
      factors.push({ label: 'Specialization', value: 20, max: 30, detail: `Related field: ${mentor.specialization}` });
    } else {
      factors.push({ label: 'Specialization', value: 0, max: 30, detail: `Different field (${mentor.specialization})` });
    }
  } else {
    factors.push({ label: 'Specialization', value: 0, max: 30, detail: 'Not specified' });
  }

  // 2. Career goals alignment (max 25)
  maxScore += 25;
  if (mentee.career_goals && mentor.specialization) {
    const goals = mentee.career_goals.toLowerCase();
    const spec = mentor.specialization.toLowerCase();
    const mentorInterests = (mentor.mentorship_interests || '').toLowerCase();
    if (goals.includes(spec) || spec.includes(goals.substring(0, 5))) {
      score += 25;
      factors.push({ label: 'Career Goals', value: 25, max: 25, detail: 'Your goals align with their expertise' });
    } else if (mentorInterests && goals.split(/\s+/).some((w: string) => w.length > 3 && mentorInterests.includes(w))) {
      score += 15;
      factors.push({ label: 'Career Goals', value: 15, max: 25, detail: 'Partial alignment with mentor interests' });
    } else {
      factors.push({ label: 'Career Goals', value: 0, max: 25, detail: 'Limited direct alignment' });
    }
  } else {
    factors.push({ label: 'Career Goals', value: 0, max: 25, detail: 'Not specified' });
  }

  // 3. Mentorship interests overlap (max 15)
  maxScore += 15;
  if (mentee.mentorship_interests && mentor.mentorship_interests) {
    const menteeInterests = mentee.mentorship_interests.toLowerCase().split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
    const mentorInterests = mentor.mentorship_interests.toLowerCase().split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
    const overlap = menteeInterests.filter((mi: string) => mentorInterests.some((ti: string) => ti && (mi.includes(ti) || ti.includes(mi))));
    if (overlap.length > 0) {
      const overlapScore = Math.min(15, overlap.length * 8);
      score += overlapScore;
      factors.push({ label: 'Mentorship Interests', value: overlapScore, max: 15, detail: `${overlap.length} shared interest${overlap.length > 1 ? 's' : ''}: ${overlap.slice(0, 2).join(', ')}` });
    } else {
      factors.push({ label: 'Mentorship Interests', value: 0, max: 15, detail: 'No overlapping interests' });
    }
  } else {
    factors.push({ label: 'Mentorship Interests', value: 0, max: 15, detail: 'Not specified' });
  }

  // 4. Rank seniority (max 20)
  maxScore += 20;
  const yearsDiff = mentor.years_of_service - mentee.years_of_service;
  if (yearsDiff >= 10) {
    score += 20;
    factors.push({ label: 'Experience Gap', value: 20, max: 20, detail: `${yearsDiff} years more senior — ideal for guidance` });
  } else if (yearsDiff >= 5) {
    score += 15;
    factors.push({ label: 'Experience Gap', value: 15, max: 20, detail: `${yearsDiff} years more senior` });
  } else if (yearsDiff >= 1) {
    score += 8;
    factors.push({ label: 'Experience Gap', value: 8, max: 20, detail: `${yearsDiff} years more senior` });
  } else {
    factors.push({ label: 'Experience Gap', value: 0, max: 20, detail: 'Similar experience level' });
  }

  // 5. Location/Command proximity (max 15)
  maxScore += 15;
  if (mentee.command_location && mentor.command_location) {
    const mLoc = mentee.command_location.toLowerCase();
    const tLoc = mentor.command_location.toLowerCase();
    if (mLoc === tLoc) {
      score += 15;
      factors.push({ label: 'Location', value: 15, max: 15, detail: `Same command: ${mentor.command_location}` });
    } else if (mLoc.includes(tLoc) || tLoc.includes(mLoc)) {
      score += 10;
      factors.push({ label: 'Location', value: 10, max: 15, detail: `Nearby: ${mentor.command_location}` });
    } else {
      factors.push({ label: 'Location', value: 0, max: 15, detail: `Different location (${mentor.command_location})` });
    }
  } else {
    factors.push({ label: 'Location', value: 0, max: 15, detail: 'Not specified' });
  }

  // 6. Mentor type bonus (max 10)
  maxScore += 10;
  if (mentor.role === 'retired_mentor') {
    const goalsText = (mentee.career_goals || '').toLowerCase();
    if (goalsText.includes('transition') || goalsText.includes('civilian') || goalsText.includes('retire')) {
      score += 10;
      factors.push({ label: 'Mentor Type', value: 10, max: 10, detail: 'Retired veteran — ideal for career transition guidance' });
    } else {
      score += 5;
      factors.push({ label: 'Mentor Type', value: 5, max: 10, detail: 'Retired veteran — offers career transition perspective' });
    }
  } else {
    score += 8;
    factors.push({ label: 'Mentor Type', value: 8, max: 10, detail: 'Active serving officer — current operational guidance' });
  }

  // 7. Branch match (max 10)
  maxScore += 10;
  if (mentee.service_branch && mentor.service_branch &&
      mentee.service_branch.toLowerCase() === mentor.service_branch.toLowerCase()) {
    score += 10;
    factors.push({ label: 'Service Branch', value: 10, max: 10, detail: `Same branch: ${mentor.service_branch}` });
  } else {
    factors.push({ label: 'Service Branch', value: 0, max: 10, detail: mentor.service_branch ? `Different branch (${mentor.service_branch})` : 'Not specified' });
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const reasons = factors.filter(f => f.value > 0).map(f => f.detail);

  let tier = 'Low Match';
  if (percentage >= 75) tier = 'Excellent Match';
  else if (percentage >= 55) tier = 'Good Match';
  else if (percentage >= 35) tier = 'Fair Match';

  return { score, maxScore, percentage, tier, factors, reasons };
}

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const mentor_id = searchParams.get('mentor_id');
    const detailed = searchParams.get('detailed');

    // Single mentor detailed match
    if (mentor_id) {
      const { data: mentor, error: mErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mentor_id)
        .single();
      if (mErr) throw mErr;

      const result = scoreMatch(profile, mentor);
      return NextResponse.json({ ...mentor, match: result });
    }

    // Get all verified, available mentors
    const { data: mentors, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'verified')
      .eq('is_accepting_mentees', true)
      .in('role', ['active_mentor', 'retired_mentor']);
    if (error) throw error;

    // Get mentee's existing requests to filter out mentors already requested
    const { data: existingRequests } = await supabase
      .from('mentorship_requests')
      .select('mentor_id, status')
      .eq('mentee_id', profile.id)
      .in('status', ['pending', 'accepted']);
    const requestedIds = new Set((existingRequests || []).map(r => r.mentor_id));

    // Get active relationships to filter out mentors already matched
    const { data: activeRels } = await supabase
      .from('mentorship_relationships')
      .select('mentor_id')
      .eq('mentee_id', profile.id)
      .eq('status', 'active');
    const activeMentorIds = new Set((activeRels || []).map(r => r.mentor_id));

    const scored = (mentors || [])
      .filter(m => !requestedIds.has(m.id) && !activeMentorIds.has(m.id) && m.id !== profile.id)
      .map(m => {
        const match = scoreMatch(profile, m);
        return { ...m, match };
      });

    scored.sort((a, b) => b.match.percentage - a.match.percentage);

    const topMatches = detailed === 'true' ? scored.slice(0, 10) : scored.slice(0, 5);
    return NextResponse.json(topMatches);
  } catch (err: any) {
    console.error('Matching GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
