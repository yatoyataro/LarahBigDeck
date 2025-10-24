-- Storage bucket policies for deck-uploads
-- Run these after creating the 'deck-uploads' bucket in Supabase Dashboard

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deck-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view/download their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deck-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'deck-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'deck-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'deck-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
