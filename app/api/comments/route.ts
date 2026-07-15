import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const postId = searchParams.get('post_id');
    const lessonId = searchParams.get('lesson_id');

    if (!postId && !lessonId) {
      return NextResponse.json({ error: 'Missing post_id or lesson_id' }, { status: 400 });
    }

    if (lessonId) {
      const { data: comments, error } = await supabase
        .from('lesson_comments')
        .select('*')
        .eq('lesson_id', Number(lessonId))
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('Lesson comments GET error or table missing:', error);
        return NextResponse.json([]);
      }

      const userIds = Array.from(new Set(
        (comments || []).map(c => c.user_id).filter(Boolean)
      ));

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, rank, avatar_url')
          .in('id', userIds);
        profiles = profs || [];
      }
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      const commentsWithUsers = (comments || []).map((c: any) => {
        const user = profileMap.get(c.user_id) || null;
        return { ...c, user };
      });

      return NextResponse.json(commentsWithUsers);
    }

    let query = supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId);

    // Non-admins can only see approved comments
    if (profile.role !== 'admin') {
      query = query.eq('status', 'approved');
    }

    const { data: comments, error } = await query.order('created_at', { ascending: true });
    if (error) {
      console.warn('Comments GET error or table missing:', error);
      return NextResponse.json([]);
    }

    const userIds = Array.from(new Set(
      (comments || []).map(c => c.user_id).filter(Boolean)
    ));

    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profs, error: profsError } = await supabase
        .from('profiles')
        .select('id, full_name, rank, avatar_url')
        .in('id', userIds);
      if (profsError) throw profsError;
      profiles = profs || [];
    }
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const commentsWithUsers = (comments || []).map((c: any) => {
      const user = profileMap.get(c.user_id) || null;
      return { ...c, user };
    });

    return NextResponse.json(commentsWithUsers);
  } catch (err: any) {
    console.error('Comments GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { post_id, content, lesson_id } = body;

    if (!content || (!post_id && !lesson_id)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (lesson_id) {
      const { data: comment, error } = await supabase
        .from('lesson_comments')
        .insert({
          lesson_id: Number(lesson_id),
          user_id: profile.id,
          content
        })
        .select()
        .single();
      if (error) throw error;

      const { data: userProf, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, rank, avatar_url')
        .eq('id', profile.id)
        .single();
      if (userError) throw userError;

      comment.user = userProf;

      await logAudit(profile.id, 'post_lesson_comment', 'lesson_comment', String(comment.id), `Comment on lesson: ${lesson_id}`);
      return NextResponse.json(comment, { status: 201 });
    }

    const { data: comment, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id,
        user_id: profile.id,
        content,
        status: profile.role === 'admin' ? 'approved' : 'pending', // Admins automatically auto-approve
      })
      .select()
      .single();
    if (error) throw error;

    const { data: userProf, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, rank, avatar_url')
      .eq('id', profile.id)
      .single();
    if (userError) throw userError;

    comment.user = userProf;

    await logAudit(profile.id, 'post_comment', 'blog_comment', String(comment.id), `Comment on post: ${post_id}`);
    return NextResponse.json(comment, { status: 201 });
  } catch (err: any) {
    console.error('Comments POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from('blog_comments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(profile.id, 'moderate_comment', 'blog_comment', String(id), `Set status to: ${status}`);
    return NextResponse.json(comment);
  } catch (err: any) {
    console.error('Comments PUT error:', err);
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
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Verify ownership or admin role
    const { data: comment, error: fetchError } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.user_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;

    await logAudit(profile.id, 'delete_comment', 'blog_comment', String(id), `Comment deleted`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Comments DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
