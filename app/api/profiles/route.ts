import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth, requireProfile, requireRole, logAudit, getProfile } from '@/lib/api-helpers';
import { mailer } from '@/lib/mail';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const me = searchParams.get('me');
    const id = searchParams.get('id');
    const mentors = searchParams.get('mentors');
    const type = searchParams.get('type');
    const specialization = searchParams.get('specialization');
    const branch = searchParams.get('branch');
    const q = searchParams.get('q');

    if (me === 'true') {
      const profile = await requireProfile(req);
      if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      return NextResponse.json(profile);
    }

    if (id) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) throw error;

      // Sanitization: If caller is a mentor and target is a mentee, check for active or paused relationship
      const callerProfile = await getProfile(req);
      if (
        callerProfile &&
        (callerProfile.role === 'active_mentor' || callerProfile.role === 'retired_mentor') &&
        data.role === 'mentee'
      ) {
        const { data: rels } = await supabase
          .from('mentorship_relationships')
          .select('status')
          .eq('mentor_id', callerProfile.id)
          .eq('mentee_id', data.id)
          .in('status', ['active', 'paused']);
        
        const hasActiveOrPaused = rels && rels.length > 0;
        if (!hasActiveOrPaused) {
          data.command_location = '';
        }
      }

      return NextResponse.json(data);
    }

    if (mentors === 'true') {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'verified')
        .in('role', ['active_mentor', 'retired_mentor'])
        .order('full_name', { ascending: true });

      if (type && type !== 'all') {
        query = query.eq('role', type);
      }
      if (specialization && specialization !== 'all') {
        query = query.eq('specialization', specialization);
      }
      if (branch && branch !== 'all') {
        query = query.eq('service_branch', branch);
      }
      if (q) {
        query = query.or(`full_name.ilike.%${q}%,specialization.ilike.%${q}%,bio.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  } catch (err: any) {
    console.error('Profiles GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const profileData = {
      email: user.email,
      auth_id: user.id,
      full_name: body.full_name,
      role: body.role,
      is_content_contributor: body.is_content_contributor || false,
      verification_status: 'pending',
      service_number: body.service_number || null,
      service_branch: body.service_branch || '',
      specialization: body.specialization || '',
      rank: body.rank || '',
      years_of_service: body.years_of_service || 0,
      command_location: body.command_location || '',
      career_goals: body.career_goals || '',
      mentorship_interests: body.mentorship_interests || '',
      bio: body.bio || '',
      avatar_url: body.avatar_url || null,
      additional_pictures: body.additional_pictures || [],
      last_rank_held: body.last_rank_held || null,
      years_served: body.years_served || null,
      years_since_retirement: body.years_since_retirement || null,
      civilian_role: body.civilian_role || null,
      civilian_industry: body.civilian_industry || null,
      is_accepting_mentees: body.is_accepting_mentees !== undefined ? body.is_accepting_mentees : true,
      max_mentees: body.max_mentees || 5,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    if (error) throw error;
    
    // Trigger Welcome Email (wrap in try/catch to ensure API response succeeds even if email service has issues)
    try {
      if (data && data.email) {
        await mailer.sendWelcomeEmail(data.email, data.full_name, data.role);
        await logAudit(data.id, 'SEND_WELCOME_EMAIL', 'profiles', String(data.id), `Sent welcome email to ${data.email}`);
      }
    } catch (mailErr) {
      console.error('Welcome email sending failed:', mailErr);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Profiles POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    if (action === 'verify') {
      const admin = await requireRole(req, ['admin']);
      if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { id, verification_status } = await req.json();
      const { data, error } = await supabase
        .from('profiles')
        .update({ verification_status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAudit(admin.id, verification_status === 'verified' ? 'verify_user' : 'reject_user', 'profile', id, `User ${data.full_name} ${verification_status}`);
      return NextResponse.json(data);
    }

    if (action === 'permissions') {
      const admin = await requireRole(req, ['admin']);
      if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { id, can_manage_blog, can_manage_courses, can_manage_library } = await req.json();
      const { data, error } = await supabase
        .from('profiles')
        .update({ can_manage_blog, can_manage_courses, can_manage_library })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAudit(admin.id, 'update_user_permissions', 'profile', String(id), `Updated permissions: blog=${can_manage_blog}, courses=${can_manage_courses}, library=${can_manage_library}`);
      return NextResponse.json(data);
    }

    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const updates = await req.json();
    delete updates.id;
    delete updates.email;
    delete updates.auth_id;
    delete updates.verification_status;
    delete updates.role;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Profiles PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
