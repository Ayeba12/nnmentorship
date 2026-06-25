import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireProfile } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const mentorId = searchParams.get('mentor_id');
    const week = searchParams.get('week'); // YYYY-MM-DD

    if (!mentorId) {
      return NextResponse.json({ error: 'Missing mentor_id' }, { status: 400 });
    }

    // 1. Fetch availability slots for the mentor
    const { data: slots, error: slotsError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('mentor_id', mentorId);
    if (slotsError) throw slotsError;

    // 2. Fetch booked sessions for that week if provided
    let bookedSessions: any[] = [];
    if (week) {
      const weekStart = new Date(week);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Find active relationships for this mentor to fetch their sessions
      const { data: rels } = await supabase
        .from('mentorship_relationships')
        .select('id')
        .eq('mentor_id', mentorId)
        .eq('status', 'active');
      const relIds = rels?.map(r => r.id) || [];

      if (relIds.length > 0) {
        const { data: sess, error: sessError } = await supabase
          .from('sessions')
          .select('*')
          .in('relationship_id', relIds)
          .gte('scheduled_at', weekStart.toISOString())
          .lt('scheduled_at', weekEnd.toISOString())
          .in('status', ['scheduled', 'pending_confirmation']);
        if (sessError) throw sessError;
        bookedSessions = sess || [];
      }
    }

    return NextResponse.json({ slots: slots || [], bookedSessions });
  } catch (err: any) {
    console.error('Availability GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (profile.role !== 'active_mentor' && profile.role !== 'retired_mentor' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only mentors or admins can add availability' }, { status: 403 });
    }

    const body = await req.json();
    const { day_of_week, start_time, end_time, is_recurring, specific_date } = body;

    const { data, error } = await supabase
      .from('availability_slots')
      .insert({
        mentor_id: profile.id,
        day_of_week,
        start_time,
        end_time,
        is_recurring: is_recurring !== undefined ? is_recurring : true,
        specific_date: specific_date || null,
        is_booked: false,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Availability POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing slot id' }, { status: 400 });
    }

    // Verify ownership of the slot
    const { data: slot, error: fetchError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.mentor_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Availability DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
