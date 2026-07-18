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

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, reading_list_id, book_id, id } = body;

    if (action === 'add_item') {
      if (!reading_list_id || !book_id) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      // Check list ownership (curator) or admin
      const { data: list, error: listErr } = await supabase
        .from('reading_lists')
        .select('*')
        .eq('id', reading_list_id)
        .single();
      
      if (listErr || !list) {
        return NextResponse.json({ error: 'Reading list not found' }, { status: 404 });
      }

      if (list.curator_id !== profile.id && profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Check if already exists in reading list
      const { data: existing } = await supabase
        .from('reading_list_items')
        .select('*')
        .eq('reading_list_id', reading_list_id)
        .eq('library_item_id', book_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ message: 'Item already in reading list' });
      }

      // Insert item
      const { data: inserted, error: insertErr } = await supabase
        .from('reading_list_items')
        .insert({
          reading_list_id,
          library_item_id: book_id,
          order_index: 0
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      await logAudit(profile.id, 'add_reading_list_item', 'reading_list_item', String(inserted.id), `List ID: ${reading_list_id}, Book ID: ${book_id}`);
      return NextResponse.json(inserted);
    }

    if (action === 'remove_item') {
      if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
      }

      // Delete item
      const { error: deleteErr } = await supabase
        .from('reading_list_items')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;

      await logAudit(profile.id, 'remove_reading_list_item', 'reading_list_item', String(id), `Item deleted`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Reading lists PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
