import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, target_role } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        target_role: target_role || 'all',
        sender_name: profile.full_name || 'System'
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAudit(profile.id, 'posted_announcement', 'announcement', data.id ? String(data.id) : null, `Posted announcement: ${title}`);

    // Batch insert notifications for all target users
    try {
      let profilesQuery = supabase.from('profiles').select('id');
      if (target_role && target_role !== 'all') {
        profilesQuery = profilesQuery.eq('role', target_role);
      }
      const { data: usersToNotify } = await profilesQuery;

      if (usersToNotify && usersToNotify.length > 0) {
        const notifsToInsert = usersToNotify.map((u: any) => ({
          user_id: u.id,
          type: 'announcement',
          title: `Announcement: ${title}`,
          message: content.length > 100 ? `${content.substring(0, 97)}...` : content,
          link: '/dashboard',
          read: false
        }));
        await supabase.from('notifications').insert(notifsToInsert);
      }
    } catch (notifErr) {
      console.error('Failed to batch insert announcement notifications:', notifErr);
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
