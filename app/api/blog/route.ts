import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';
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
    let profile = null;
    try {
      profile = await requireProfile(req);
    } catch (e) {
      // Ignore auth error for public requests
    }

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
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
        if (!isProduction) {
          const mockP = MOCK_POSTS.find(p => p.id === postId);
          if (mockP) return NextResponse.json(mockP);
        }
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      // Fetch author in JS if missing (mock DB failover)
      if (!dbPost.author && dbPost.author_id) {
        const { data: auth } = await supabase
          .from('profiles')
          .select('id, full_name, rank, avatar_url')
          .eq('id', dbPost.author_id)
          .single();
        dbPost.author = auth || null;
      }

      // Fetch comments in JS if missing (mock DB failover)
      if (!dbPost.comments) {
        const { data: comments } = await supabase
          .from('blog_comments')
          .select('*')
          .eq('post_id', postId);
        
        let commentsList = comments || [];
        // Fetch users for comments
        const userIds = Array.from(new Set(commentsList.map(c => c.user_id).filter(Boolean)));
        let commentUsers: any[] = [];
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, rank, avatar_url')
            .in('id', userIds);
          commentUsers = users || [];
        }
        const userMap = new Map(commentUsers.map(u => [u.id, u]));

        dbPost.comments = commentsList.map(c => ({
          ...c,
          user: userMap.get(c.user_id) || null
        }));
      }

      // Filter approved comments for non-admins
      if (dbPost.comments && (!profile || profile.role !== 'admin')) {
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
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    if (listError || !dbPosts || dbPosts.length === 0) {
      if (isProduction) {
        return NextResponse.json([]);
      }
      // Fallback to mock posts
      let filteredMock = MOCK_POSTS;
      if (category) {
        filteredMock = MOCK_POSTS.filter(p => p.category === category);
      }
      return NextResponse.json(filteredMock);
    }

    // Ensure authors are populated (critical for mock database failover)
    const postsWithAuthors = [];
    const authorIds = Array.from(new Set(dbPosts.map(p => p.author_id).filter(Boolean)));
    let profiles: any[] = [];
    if (authorIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, rank, avatar_url')
        .in('id', authorIds);
      profiles = profs || [];
    }
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    for (const post of dbPosts) {
      if (!post.author) {
        post.author = profileMap.get(post.author_id) || null;
      }
      postsWithAuthors.push(post);
    }

    return NextResponse.json(postsWithAuthors);
  } catch (err: any) {
    console.error('Blog GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!profile.is_content_contributor && profile.role !== 'admin' && !profile.can_manage_blog) {
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

    // Verify ownership or management permissions for editing
    const { data: postToCheck } = await supabase.from('blog_posts').select('author_id').eq('id', id).single();
    const isAuthor = postToCheck && postToCheck.author_id === profile.id;
    const hasCMSPermission = profile.role === 'admin' || profile.can_manage_blog || profile.is_content_contributor;

    if (!isAuthor && !hasCMSPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

export async function DELETE(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing post ID' }, { status: 400 });

    const postId = Number(id);

    // Verify ownership or management permissions
    const { data: postToCheck } = await supabase.from('blog_posts').select('author_id').eq('id', postId).single();
    const isAuthor = postToCheck && postToCheck.author_id === profile.id;
    const hasCMSPermission = profile.role === 'admin' || profile.can_manage_blog;

    if (!isAuthor && !hasCMSPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete comments first
    await supabase.from('blog_comments').delete().eq('post_id', postId);

    // Delete blog post
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);
    if (error) throw error;

    await logAudit(profile.id, 'delete_blog_post', 'blog_post', String(postId), `Deleted post ID: ${postId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Blog DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
