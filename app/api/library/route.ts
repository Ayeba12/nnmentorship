import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

const MOCK_LIBRARY = [
  {
    id: 701,
    title: 'Nigerian Navy Doctrine (NND 2024)',
    description: 'The official doctrine document outlining the strategic operations, maritime strategy, and command guidelines of the Nigerian Navy.',
    category: 'Regulations',
    format: 'pdf',
    file_url: null,
    external_link: 'https://example.com/navy-doctrine-2024.pdf',
    author: 'Naval Headquarters',
    rank_level: 'All',
    uploaded_by: 1,
    downloads_count: 142,
    created_at: new Date().toISOString()
  },
  {
    id: 702,
    title: 'Manual of Naval Correspondence',
    description: 'A guidelines manual details style, formatting, and protocols for official letters, memos, signals, and naval communications.',
    category: 'Administration',
    format: 'document',
    file_url: null,
    external_link: 'https://example.com/navy-correspondence-manual.docx',
    author: 'Naval Secretary Directorate',
    rank_level: 'All',
    uploaded_by: 1,
    downloads_count: 89,
    created_at: new Date().toISOString()
  },
  {
    id: 703,
    title: 'Basic Seamanship and General Navigation',
    description: 'An educational handbook covering anchor work, ship handling, mooring, basic celestial navigation, and nautical terms.',
    category: 'Seamanship',
    format: 'pdf',
    file_url: null,
    external_link: 'https://example.com/basic-seamanship.pdf',
    author: 'Nigerian Naval College',
    rank_level: 'Junior Officer / Rating',
    uploaded_by: 2,
    downloads_count: 213,
    created_at: new Date().toISOString()
  }
];

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const id = searchParams.get('id');

    // 1. Fetch single item
    if (id) {
      const itemId = Number(id);
      const { data: dbItem, error } = await supabase
        .from('library_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !dbItem) {
        const mockItem = MOCK_LIBRARY.find(item => item.id === itemId);
        if (mockItem) return NextResponse.json(mockItem);
        return NextResponse.json({ error: 'Library item not found' }, { status: 404 });
      }

      return NextResponse.json(dbItem);
    }

    // 2. Fetch list
    let query = supabase.from('library_items').select('*');

    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: dbItems, error: listError } = await query;
    if (listError || !dbItems || dbItems.length === 0) {
      // Fallback to mock
      let filteredMock = MOCK_LIBRARY;
      if (category) {
        filteredMock = filteredMock.filter(item => item.category === category);
      }
      if (search) {
        filteredMock = filteredMock.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));
      }
      return NextResponse.json(filteredMock);
    }

    return NextResponse.json(dbItems);
  } catch (err: any) {
    console.error('Library GET error:', err);
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
    const { title, description, category, format, file_url, external_link, author, rank_level } = body;

    if (!title || !description || !category || !format) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('library_items')
      .insert({
        title,
        description,
        category,
        format,
        file_url: file_url || null,
        external_link: external_link || null,
        author: author || null,
        rank_level: rank_level || 'All',
        uploaded_by: profile.id,
        downloads_count: 0,
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit(profile.id, 'upload_library_item', 'library_item', String(item.id), `Title: ${title}`);
    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    console.error('Library POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Attempt to increment downloads count in DB
    const { data: item, error } = await supabase.rpc('increment_library_download', { row_id: id });
    
    // Fallback if RPC is not defined or fails, using simple update
    if (error) {
      const { data: fetchItem } = await supabase
        .from('library_items')
        .select('downloads_count')
        .eq('id', id)
        .single();
      
      if (fetchItem) {
        const { data: updated } = await supabase
          .from('library_items')
          .update({ downloads_count: (fetchItem.downloads_count || 0) + 1 })
          .eq('id', id)
          .select()
          .single();
        
        return NextResponse.json(updated);
      }
    }

    await logAudit(profile.id, 'download_library_item', 'library_item', String(id), `Downloaded item`);
    return NextResponse.json(item || { id });
  } catch (err: any) {
    console.error('Library PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
