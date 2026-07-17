import { NextRequest, NextResponse } from 'next/server';
import supabase, { supabaseService } from '@/lib/supabase';
import { requireRole, logAudit } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin']);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    if (action === 'stats') {
      const [users, relationships, pending, sessions, mentors, mentees] = await Promise.all([
        supabaseService.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseService.from('mentorship_relationships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabaseService.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabaseService.from('sessions').select('*', { count: 'exact', head: true }).gte('scheduled_at', new Date(new Date().setDate(1)).toISOString()),
        supabaseService.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['active_mentor', 'retired_mentor']).eq('verification_status', 'verified'),
        supabaseService.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentee').eq('verification_status', 'verified'),
      ]);

      return NextResponse.json({
        total_users: users.count || 0,
        active_relationships: relationships.count || 0,
        pending_verifications: pending.count || 0,
        sessions_this_month: sessions.count || 0,
        total_mentors: mentors.count || 0,
        total_mentees: mentees.count || 0,
      });
    }

    if (action === 'pending') {
      const { data, error } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (action === 'audit') {
      const { data: logs, error } = await supabaseService
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const actorIds = Array.from(new Set(
        (logs || []).map(l => l.actor_id).filter(Boolean)
      ));

      let profiles: any[] = [];
      if (actorIds.length > 0) {
        const { data: profs, error: profsError } = await supabaseService
          .from('profiles')
          .select('id, full_name, role')
          .in('id', actorIds);
        if (profsError) throw profsError;
        profiles = profs || [];
      }
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      const logsWithActors = (logs || []).map((log: any) => {
        const actor = profileMap.get(log.actor_id) || null;
        return { ...log, actor };
      });

      return NextResponse.json(logsWithActors);
    }

    if (action === 'reports') {
      const [allRelRaw, allSessions, allGoals, allRequests] = await Promise.all([
        supabaseService.from('mentorship_relationships').select('*'),
        supabaseService.from('sessions').select('*'),
        supabaseService.from('goals').select('*'),
        supabaseService.from('mentorship_requests').select('*'),
      ]);

      if (allRelRaw.error) throw allRelRaw.error;

      // Batch query profiles for all_relationships
      const profileIds = Array.from(new Set(
        (allRelRaw.data || []).flatMap(r => [r.mentee_id, r.mentor_id]).filter(Boolean)
      ));

      let profiles: any[] = [];
      if (profileIds.length > 0) {
        const { data: profs, error: profsError } = await supabaseService
          .from('profiles')
          .select('id, full_name')
          .in('id', profileIds);
        if (profsError) throw profsError;
        profiles = profs || [];
      }
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      const allRelWithProfiles = (allRelRaw.data || []).map((r: any) => {
        const mentee = profileMap.get(r.mentee_id) ? { full_name: profileMap.get(r.mentee_id)!.full_name } : null;
        const mentor = profileMap.get(r.mentor_id) ? { full_name: profileMap.get(r.mentor_id)!.full_name } : null;
        return { ...r, mentee, mentor };
      });

      const activeRel = allRelWithProfiles.filter(r => r.status === 'active');
      const completedSessions = allSessions.data?.filter(s => s.status === 'completed') || [];
      const completedGoals = allGoals.data?.filter(g => g.status === 'completed') || [];
      const acceptedRequests = allRequests.data?.filter(r => r.status === 'accepted') || [];
      const totalRequests = allRequests.data?.length || 0;

      const now = new Date();
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
      const longTermRel = activeRel.filter(r => new Date(r.started_at) < sixMonthsAgo).length;

      const totalGoalsCount = allGoals.data?.length || 0;

      return NextResponse.json({
        match_rate: totalRequests > 0 ? Math.round((acceptedRequests.length / totalRequests) * 100) : 0,
        total_matches: acceptedRequests.length,
        active_relationships: activeRel.length,
        sessions_completed: completedSessions.length,
        goal_completion: totalGoalsCount > 0 ? Math.round((completedGoals.length / totalGoalsCount) * 100) : 0,
        total_goals: totalGoalsCount,
        completed_goals: completedGoals.length,
        retention_rate: activeRel.length > 0 ? Math.round((longTermRel / activeRel.length) * 100) : 0,
        long_term_relationships: longTermRel,
        all_relationships: allRelWithProfiles,
      });
    }

    if (action === 'all_users') {
      const { data, error } = await supabaseService
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin']);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    if (action === 'verify') {
      const body = await req.json();
      const { id, verification_status } = body;
      const { data, error } = await supabaseService
        .from('profiles')
        .update({ verification_status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAudit(admin.id, verification_status === 'verified' ? 'verify_user' : 'reject_user', 'profile', id, `${data.full_name} ${verification_status}`);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
