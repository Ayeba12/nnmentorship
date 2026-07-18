import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';
import { requireProfile, logAudit, createNotification } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: reqs, error } = await supabase
      .from('mentorship_requests')
      .select('*')
      .or(`mentee_id.eq.${profile.id},mentor_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const profileIds = Array.from(new Set(
      (reqs || []).flatMap(r => [r.mentee_id, r.mentor_id]).filter(Boolean)
    ));

    let profiles: any[] = [];
    if (profileIds.length > 0) {
      const { data: profs, error: profsError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, service_number, service_branch, specialization, rank, years_of_service, command_location, bio, avatar_url')
        .in('id', profileIds);
      if (profsError) throw profsError;
      profiles = profs || [];
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const reqsWithProfiles = (reqs || []).map((r: any) => {
      const mentee = profileMap.get(r.mentee_id) || null;
      const mentor = profileMap.get(r.mentor_id) || null;
      return { ...r, mentee, mentor };
    });

    return NextResponse.json(reqsWithProfiles);
  } catch (err: any) {
    console.error('Requests GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mentor_id, request_type, message } = body;

    const { data, error } = await supabase
      .from('mentorship_requests')
      .insert({
        mentee_id: profile.id,
        mentor_id,
        request_type: request_type || 'mentee_choice',
        status: 'pending',
        message: message || '',
      })
      .select()
      .single();
    if (error) throw error;

    // Send notification to the mentor
    await createNotification(
      mentor_id,
      'request',
      'New Mentorship Request',
      `${profile.full_name || 'A mentee'} has requested you as a mentor.`,
      '/dashboard/requests'
    );

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Requests POST error:', err);
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
    const { id } = body;

    if (action === 'accept') {
      const { data: request, error: reqError } = await supabase
        .from('mentorship_requests')
        .select('*')
        .eq('id', id)
        .single();
      if (reqError) throw reqError;

      if (request.mentor_id !== profile.id && profile.role !== 'admin') {
        return NextResponse.json({ error: 'Only the mentor can accept' }, { status: 403 });
      }

      await supabase
        .from('mentorship_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', id);

      const { data: rel, error: relError } = await supabase
        .from('mentorship_relationships')
        .insert({
          mentee_id: request.mentee_id,
          mentor_id: request.mentor_id,
          status: 'active',
          request_id: id,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (relError) throw relError;

      await logAudit(profile.id, 'accept_request', 'mentorship_request', id, `Mentorship started`);

      // Send notification to the mentee
      await createNotification(
        request.mentee_id,
        'request',
        'Mentorship Request Accepted',
        `${profile.full_name || 'Your mentor'} has accepted your mentorship request!`,
        '/dashboard/messages'
      );

      return NextResponse.json({ request, relationship: rel });
    }

    if (action === 'decline') {
      const { data, error } = await supabase
        .from('mentorship_requests')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Send notification to the mentee
      await createNotification(
        data.mentee_id,
        'request',
        'Mentorship Request Declined',
        `${profile.full_name || 'The mentor'} declined your mentorship request.`,
        '/dashboard/requests'
      );

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Requests PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
