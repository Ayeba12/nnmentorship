import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';
import { requireProfile, requireRole, logAudit } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: rels, error } = await supabase
      .from('mentorship_relationships')
      .select('*')
      .or(`mentee_id.eq.${profile.id},mentor_id.eq.${profile.id}`)
      .order('started_at', { ascending: false });
    if (error) throw error;

    const profileIds = Array.from(new Set(
      (rels || []).flatMap(r => [r.mentee_id, r.mentor_id]).filter(Boolean)
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

    const sanitizedData = (rels || []).map((rel: any) => {
      const mentee = profileMap.get(rel.mentee_id) || null;
      const mentor = profileMap.get(rel.mentor_id) || null;
      const relWithProfiles = { ...rel, mentee, mentor };

      const isCallerMentor = rel.mentor_id === profile.id;
      const isEnded = rel.status === 'ended';
      if (isCallerMentor && isEnded && relWithProfiles.mentee) {
        return {
          ...relWithProfiles,
          mentee: {
            ...relWithProfiles.mentee,
            command_location: '',
          }
        };
      }
      return relWithProfiles;
    });

    return NextResponse.json(sanitizedData);
  } catch (err: any) {
    console.error('Relationships GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin']);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { mentee_id, mentor_id } = body;

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .insert({
        mentee_id,
        mentor_id,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit(admin.id, 'admin_assign', 'mentorship_relationship', data.id, `Admin assigned mentee ${mentee_id} to mentor ${mentor_id}`);
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Relationships POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, end_reason } = body;

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason: end_reason || 'Completed',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(profile.id, 'end_relationship', 'mentorship_relationship', id, end_reason || 'Completed');
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Relationships PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
