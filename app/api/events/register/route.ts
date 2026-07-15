import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';
import { mailer } from '@/lib/mail';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    const { data: regs, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', Number(eventId));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role, rank, avatar_url');

    const mapped = (regs || []).map(r => ({
      ...r,
      user: r.user_id ? (profiles || []).find(p => p.id === r.user_id) : null
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    const body = await req.json();
    const { event_id, status, guestName, guestEmail } = body;

    if (!event_id || !status) {
      return NextResponse.json({ error: 'Missing event ID or RSVP status' }, { status: 400 });
    }

    let result: any = null;

    if (profile) {
      // Authenticated User RSVP
      const { data: existing, error: queryErr } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', Number(event_id))
        .eq('user_id', profile.id);

      if (queryErr) {
        return NextResponse.json({ error: queryErr.message }, { status: 500 });
      }

      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from('event_registrations')
          .update({ status })
          .eq('id', existing[0].id)
          .select()
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        result = data;
      } else {
        const { data, error } = await supabase
          .from('event_registrations')
          .insert({
            event_id: Number(event_id),
            user_id: profile.id,
            status
          })
          .select()
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        result = data;
      }

      await logAudit(profile.id, 'EVENT_RSVP', 'events', String(event_id), `RSVP'd: ${status}`);
    } else {
      // Public Guest RSVP
      if (!guestName || !guestEmail) {
        return NextResponse.json({ error: 'Name and email are required for guest RSVP' }, { status: 400 });
      }

      const { data: existing, error: queryErr } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', Number(event_id))
        .eq('guest_email', guestEmail);

      if (queryErr) {
        return NextResponse.json({ error: queryErr.message }, { status: 500 });
      }

      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from('event_registrations')
          .update({ status, guest_name: guestName })
          .eq('id', existing[0].id)
          .select()
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        result = data;
      } else {
        const { data, error } = await supabase
          .from('event_registrations')
          .insert({
            event_id: Number(event_id),
            guest_name: guestName,
            guest_email: guestEmail,
            status
          })
          .select()
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        result = data;
      }
    }

    // Trigger RSVP Confirmation Email
    if (result) {
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('title, scheduled_at, meeting_link')
          .eq('id', Number(event_id))
          .single();

        if (eventData) {
          const emailTo = profile ? profile.email : guestEmail;
          const nameTo = profile ? profile.full_name : guestName;
          if (emailTo && nameTo) {
            await mailer.sendEventRegistrationEmail(
              emailTo,
              nameTo,
              eventData.title,
              eventData.scheduled_at,
              status,
              eventData.meeting_link || undefined
            );
          }
        }
      } catch (mailErr) {
        console.error('Failed to send RSVP confirmation email:', mailErr);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
