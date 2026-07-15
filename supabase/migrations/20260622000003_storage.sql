-- 1. Add additional_pictures column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS additional_pictures TEXT[] DEFAULT '{}';

-- 2. Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('profile-gallery', 'profile-gallery', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('course-thumbnails', 'course-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for 'avatars' bucket
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update/delete their own avatars" ON storage.objects;
CREATE POLICY "Users can update/delete their own avatars" ON storage.objects
  FOR ALL USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- 4. Create policies for 'profile-gallery' bucket
DROP POLICY IF EXISTS "Public can view profile gallery" ON storage.objects;
CREATE POLICY "Public can view profile gallery" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-gallery');

DROP POLICY IF EXISTS "Authenticated users can upload profile gallery" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile gallery" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-gallery' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update/delete their own gallery photos" ON storage.objects;
CREATE POLICY "Users can update/delete their own gallery photos" ON storage.objects
  FOR ALL USING (bucket_id = 'profile-gallery' AND auth.uid() = owner);

-- 5. Create policies for 'course-thumbnails' bucket
DROP POLICY IF EXISTS "Public can view course thumbnails" ON storage.objects;
CREATE POLICY "Public can view course thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-thumbnails');

DROP POLICY IF EXISTS "Authenticated users can upload course thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload course thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update/delete their own course thumbnails" ON storage.objects;
CREATE POLICY "Users can update/delete their own course thumbnails" ON storage.objects
  FOR ALL USING (bucket_id = 'course-thumbnails' AND auth.uid() = owner);
