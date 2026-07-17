import { NextRequest, NextResponse } from 'next/server';
import supabase, { supabaseService } from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';
import { mailer } from '@/lib/mail';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let query = supabaseService.from('events').select('*');
    if (id) {
      query = query.eq('id', Number(id));
    }
    
    // Sort events by scheduled_at ascending
    query = query.order('scheduled_at', { ascending: true });

    const { data: events, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!events) {
      return NextResponse.json([]);
    }

    // Filter events by visibility if user is not logged in
    let filteredEvents = events;
    if (!profile) {
      filteredEvents = events.filter(e => e.visibility === 'public');
    }

    // Load registrations and profiles
    const { data: registrations } = await supabaseService.from('event_registrations').select('*');
    const { data: profiles } = await supabaseService.from('profiles').select('id, full_name, email, role, rank, avatar_url');

    const mappedEvents = filteredEvents.map(event => {
      const eventRegs = (registrations || [])
        .filter(r => r.event_id === event.id)
        .map(r => ({
          ...r,
          user: r.user_id ? (profiles || []).find(p => p.id === r.user_id) : null
        }));

      return {
        ...event,
        registrations: eventRegs
      };
    });

    if (id && mappedEvents.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(id ? mappedEvents[0] : mappedEvents);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      event_type,
      visibility,
      scheduled_at,
      duration_minutes,
      location,
      meeting_link,
      audio_url,
      external_link
    } = body;

    if (!title || !event_type || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseService.from('events').insert({
      title,
      description,
      event_type,
      visibility: visibility || 'public',
      scheduled_at,
      duration_minutes: duration_minutes || 60,
      location: location || null,
      meeting_link: meeting_link || null,
      audio_url: audio_url || null,
      external_link: external_link || null,
      created_by: profile.id
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit(profile.id, 'CREATE_EVENT', 'events', String(data.id), `Created event: ${title}`);

    // Trigger Broadside Notification Email to all platform users
    try {
      const { data: users } = await supabaseService
        .from('profiles')
        .select('email')
        .not('email', 'is', null);

      const recipientEmails = (users || [])
        .map((u: any) => u.email)
        .filter(Boolean);

      if (recipientEmails.length > 0) {
        mailer.sendEventPublishedEmail(
          recipientEmails,
          title,
          description || '',
          scheduled_at,
          meeting_link || undefined
        ).catch(mailErr => {
          console.error('Failed to broadcast new event email in background:', mailErr);
        });
      }
    } catch (mailErr) {
      console.error('Failed to broadcast new event email:', mailErr);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    const { data, error } = await supabaseService.from('events').update({
      ...updates
    }).eq('id', id).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit(profile.id, 'UPDATE_EVENT', 'events', String(id), `Updated event details`);

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      if (!body.id) {
        return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
      }
      return executeDelete(Number(body.id), profile.id);
    }

    return executeDelete(Number(id), profile.id);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function executeDelete(id: number, actorId: number) {
  const { error } = await supabaseService.from('events').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit(actorId, 'DELETE_EVENT', 'events', String(id), `Deleted event`);
  return NextResponse.json({ success: true });
}
