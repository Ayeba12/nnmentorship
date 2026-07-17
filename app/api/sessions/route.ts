import { NextRequest, NextResponse } from 'next/server';
import supabase, { supabaseService } from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch relationships for this user
    const { data: rels, error: relsError } = await supabaseService
      .from('mentorship_relationships')
      .select('*')
      .or(`mentee_id.eq.${profile.id},mentor_id.eq.${profile.id}`);
    if (relsError) throw relsError;

    const relIds = rels?.map(r => r.id) || [];
    if (relIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch sessions for these relationships
    const { data: sessions, error: sessError } = await supabaseService
      .from('sessions')
      .select('*')
      .in('relationship_id', relIds)
      .order('scheduled_at', { ascending: false });
    if (sessError) throw sessError;

    // 3. Batch query profile records for all mentees and mentors in these relationships
    const profileIds = Array.from(new Set(
      rels.flatMap(r => [r.mentee_id, r.mentor_id]).filter(Boolean)
    ));

    let profiles: any[] = [];
    if (profileIds.length > 0) {
      const { data: profs, error: profsError } = await supabaseService
        .from('profiles')
        .select('id, full_name, rank, avatar_url')
        .in('id', profileIds);
      if (profsError) throw profsError;
      profiles = profs || [];
    }
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // 4. Map relationships and profiles back to sessions in memory
    const relMap = new Map(rels.map(r => {
      const mentee = profileMap.get(r.mentee_id) || null;
      const mentor = profileMap.get(r.mentor_id) || null;
      return [r.id, { ...r, mentee, mentor }];
    }));

    const sessionsWithRelationships = (sessions || []).map((sess: any) => {
      const relationship = relMap.get(sess.relationship_id) || null;
      return { ...sess, relationship };
    });

    return NextResponse.json(sessionsWithRelationships);
  } catch (err: any) {
    console.error('Sessions GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { relationship_id, scheduled_at, duration_minutes, session_type, agenda } = body;

    // Check relationship
    const { data: rel, error: relError } = await supabaseService
      .from('mentorship_relationships')
      .select('*')
      .eq('id', relationship_id)
      .single();
    if (relError || !rel) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    if (rel.status === 'ended') {
      return NextResponse.json({ error: 'Cannot book sessions on an ended relationship' }, { status: 400 });
    }

    // Determine status
    const status = session_type === 'proposed_time' ? 'pending_confirmation' : 'scheduled';

    const { data: session, error: sessError } = await supabaseService
      .from('sessions')
      .insert({
        relationship_id,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        session_type: session_type || 'booked_slot',
        status,
        notes: agenda ? `Agenda: ${agenda}` : null,
      })
      .select()
      .single();
    if (sessError) throw sessError;

    await logAudit(profile.id, 'book_session', 'session', String(session.id), `Booked session type: ${session_type}`);

    return NextResponse.json(session, { status: 201 });
  } catch (err: any) {
    console.error('Sessions POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    const body = await req.json();
    const { id, status, notes, goals_set, progress_recorded } = body;

    // Fetch existing session
    const { data: existing, error: fetchError } = await supabaseService
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch existing relationship
    const { data: rel, error: relError } = await supabaseService
      .from('mentorship_relationships')
      .select('*')
      .eq('id', existing.relationship_id)
      .single();
    if (relError || !rel) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    existing.relationship = rel;

    // Auth check
    if (rel.mentee_id !== profile.id && rel.mentor_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (rel.status === 'ended') {
      return NextResponse.json({ error: 'Cannot modify sessions on an ended relationship' }, { status: 400 });
    }

    const updateData: any = {};

    if (action === 'confirm') {
      updateData.status = 'scheduled';
    } else if (action === 'reject_proposal') {
      updateData.status = 'cancelled';
    } else {
      // Direct update
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (goals_set !== undefined) updateData.goals_set = goals_set;
      if (progress_recorded !== undefined) updateData.progress_recorded = progress_recorded;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { data: updated, error: updateError } = await supabaseService
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw updateError;

    await logAudit(profile.id, 'update_session', 'session', String(id), `Session action/status: ${action || status}`);

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Sessions PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
