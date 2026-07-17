import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase, isProduction } from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const MOCK_READING_LISTS = [
  {
    id: 801,
    title: 'Officer Development Core Readings',
    description: 'A curated selection of books, pamphlets, and operational manuals that every junior officer must read to understand command operations and naval protocol.',
    category: 'Leadership',
    curator_id: 1,
    created_at: new Date().toISOString(),
    curator: { id: 1, full_name: 'Rear Admiral A. O. Bello', rank: 'Rear Admiral' }
  },
  {
    id: 802,
    title: 'Anti-Piracy Operations Preparation',
    description: 'Manuals and strategy reports recommended for personnel preparing for deployment to combat vessel boardings in the Gulf of Guinea.',
    category: 'Operations',
    curator_id: 2,
    created_at: new Date().toISOString(),
    curator: { id: 2, full_name: 'Commodore S. I. Alabi', rank: 'Commodore' }
  }
];

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      // In a real database we would query and join.
      // For now we return mock details or query table.
      // Since it's a phase 2 table, we will query from supabase first, else return mock.
      const { data: dbList, error } = await supabase
        .from('reading_lists')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !dbList) {
        if (!isProduction) {
          const mockList = MOCK_READING_LISTS.find(l => l.id === Number(id));
          if (mockList) return NextResponse.json(mockList);
        }
        return NextResponse.json({ error: 'Reading list not found' }, { status: 404 });
      }

      if (dbList.curator_id) {
        const { data: curator } = await supabase
          .from('profiles')
          .select('id, full_name, rank')
          .eq('id', dbList.curator_id)
          .single();
        dbList.curator = curator;
      } else {
        dbList.curator = null;
      }

      return NextResponse.json(dbList);
    }

    const { data: dbLists, error: listError } = await supabase
      .from('reading_lists')
      .select('*');

    if (listError || !dbLists || dbLists.length === 0) {
      if (isProduction) {
        return NextResponse.json([]);
      }
      return NextResponse.json(MOCK_READING_LISTS);
    }

    const curatorIds = Array.from(new Set(
      dbLists.map(l => l.curator_id).filter(Boolean)
    ));

    let profiles: any[] = [];
    if (curatorIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, rank')
        .in('id', curatorIds);
      profiles = profs || [];
    }
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const listsWithCurators = dbLists.map(l => {
      const curator = profileMap.get(l.curator_id) || null;
      return { ...l, curator };
    });

    return NextResponse.json(listsWithCurators);
  } catch (err: any) {
    console.error('Reading lists GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!profile.is_content_contributor && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: list, error } = await supabase
      .from('reading_lists')
      .insert({
        title,
        description,
        category,
        curator_id: profile.id,
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit(profile.id, 'create_reading_list', 'reading_list', String(list.id), `Title: ${title}`);
    return NextResponse.json(list, { status: 201 });
  } catch (err: any) {
    console.error('Reading lists POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
