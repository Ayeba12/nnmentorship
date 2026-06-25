import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

const MOCK_POSTS = [
  {
    id: 501,
    title: 'Securing the Gulf of Guinea: Modern Anti-Piracy Operations',
    slug: 'securing-the-gulf-of-guinea',
    excerpt: 'An analysis of contemporary maritime threats in West African waters and the strategic responses implemented by the Nigerian Navy.',
    content: 'The Gulf of Guinea has historically been a critical maritime transit corridor, yet it remains one of the world\'s most challenging regions for piracy and armed robbery at sea. In recent years, the Nigerian Navy has restructured its patrol strategies, deploying state-of-the-art offshore patrol vessels (OPVs), implementing the Falcon Eye maritime domain awareness system, and strengthening regional collaborations.\n\nKey to these successes has been the integration of air assets, naval intelligence, and fast interception boats. Junior officers must understand the geopolitical importance of secure sea lines of communication (SLOC) and the tactical procedures of Boarding, Search, and Seizure (VBSS) operations.',
    category: 'Operations',
    tags: 'Piracy, Gulf of Guinea, Patrol',
    cover_image: null,
    author_id: 2,
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    author: { id: 2, full_name: 'Commodore S. I. Alabi', rank: 'Commodore', avatar_url: null },
    comments: [
      {
        id: 601,
        post_id: 501,
        user_id: 3,
        content: 'This is an excellent summary, sir. The Falcon Eye system has indeed transformed our situational awareness.',
        status: 'approved',
        created_at: new Date().toISOString(),
        user: { id: 3, full_name: 'Lieutenant Commander K. O. Cole', rank: 'Lt Commander', avatar_url: null }
      }
    ]
  },
  {
    id: 502,
    title: 'Navigating Career Progression as a Naval Officer',
    slug: 'navigating-career-progression',
    excerpt: 'Guidance and leadership insights for junior officers on promotions, staff courses, and specialization pathways.',
    content: 'A career in the Nigerian Navy is both highly rewarding and demanding. Progression from Sub-Lieutenant to Captain requires more than just years of service—it requires continuous professional military education, outstanding performance in command and staff appointments, and personal integrity.\n\nThis article outlines the milestones: completing the Junior Staff Course, choosing specialization branches (such as Navigation, Weapons Engineering, Hydrography, or Logistics), and the critical role that mentorship plays in helping you navigate these vital transitions.',
    category: 'Career Advice',
    tags: 'Promotion, Career, Specialization',
    cover_image: null,
    author_id: 1,
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    author: { id: 1, full_name: 'Rear Admiral A. O. Bello', rank: 'Rear Admiral', avatar_url: null }
  }
];

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    // 1. Fetch single post with author and comments
    if (id) {
      const postId = Number(id);
      const { data: dbPost, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!author_id(id, full_name, rank, avatar_url),
          comments:blog_comments(*, user:profiles!user_id(id, full_name, rank, avatar_url))
        `)
        .eq('id', postId)
        .single();

      if (error || !dbPost) {
        // Fallback to mock post
        const mockP = MOCK_POSTS.find(p => p.id === postId);
        if (mockP) return NextResponse.json(mockP);
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      // Filter approved comments for non-admins
      if (dbPost.comments && profile.role !== 'admin') {
        dbPost.comments = dbPost.comments.filter((c: any) => c.status === 'approved');
      }

      return NextResponse.json(dbPost);
    }

    // 2. Fetch list of published posts
    let query = supabase
      .from('blog_posts')
      .select('*, author:profiles!author_id(id, full_name, rank, avatar_url)')
      .eq('status', 'published');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: dbPosts, error: listError } = await query;
    if (listError || !dbPosts || dbPosts.length === 0) {
      // Fallback to mock posts
      let filteredMock = MOCK_POSTS;
      if (category) {
        filteredMock = MOCK_POSTS.filter(p => p.category === category);
      }
      return NextResponse.json(filteredMock);
    }

    return NextResponse.json(dbPosts);
  } catch (err: any) {
    console.error('Blog GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!profile.is_content_contributor && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only approved content contributors can create posts' }, { status: 403 });
    }

    const body = await req.json();
    const { title, excerpt, content, category, tags, cover_image } = body;

    if (!title || !excerpt || !content || !category) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt,
        content,
        category,
        tags: tags || '',
        cover_image: cover_image || null,
        author_id: profile.id,
        status: profile.role === 'admin' ? 'published' : 'draft',
        published_at: profile.role === 'admin' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit(profile.id, 'create_post', 'blog_post', String(post.id), `Title: ${title}`);
    return NextResponse.json(post, { status: 201 });
  } catch (err: any) {
    console.error('Blog POST error:', err);
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

    const updateData: any = {};
    if (action === 'submit') {
      updateData.status = 'pending_review';
    } else if (action === 'approve') {
      if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      updateData.status = 'published';
      updateData.published_at = new Date().toISOString();
    } else if (action === 'reject') {
      if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      updateData.status = 'rejected';
    } else {
      // General update
      const { title, excerpt, content, category, tags, cover_image, status } = body;
      if (title) {
        updateData.title = title;
        updateData.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (excerpt) updateData.excerpt = excerpt;
      if (content) updateData.content = content;
      if (category) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (cover_image !== undefined) updateData.cover_image = cover_image;
      if (status) updateData.status = status;
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(profile.id, `update_post_${action || 'edit'}`, 'blog_post', String(id), `Post status set to: ${post.status}`);
    return NextResponse.json(post);
  } catch (err: any) {
    console.error('Blog PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
