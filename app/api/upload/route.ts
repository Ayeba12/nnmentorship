import { NextRequest, NextResponse } from 'next/server';
import { requireProfile } from '@/lib/api-helpers';
import { supabaseService as supabase } from '@/lib/supabase';
import path from 'path';

let bucketChecked = false;

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure bucket exists
    if (!bucketChecked) {
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.some(b => b.id === 'course-thumbnails')) {
          await supabase.storage.createBucket('course-thumbnails', {
            public: true
          });
        }
        bucketChecked = true;
      } catch (bucketErr) {
        console.warn('Bucket check/create failed (normal in offline/mock mode):', bucketErr);
      }
    }

    // Create unique filename
    const fileExt = path.extname(file.name) || '.png';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExt}`;

    // Save/upload file to object storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-thumbnails')
      .upload(filename, buffer, {
        contentType: file.type,
        duplex: 'half'
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public url
    const { data } = supabase.storage
      .from('course-thumbnails')
      .getPublicUrl(filename);

    const publicUrl = data?.publicUrl || `/uploads/${filename}`;
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: 500 });
  }
}
