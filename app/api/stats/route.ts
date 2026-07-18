import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [personnel, matches, courses, library] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin').eq('verification_status', 'verified'),
      supabase.from('mentorship_relationships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('library_books').select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      totalPersonnel: personnel.count || 0,
      activeMatches: matches.count || 0,
      coursesCount: courses.count || 0,
      booksCount: library.count || 0,
    });
  } catch (err: any) {
    console.error('Public stats fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
