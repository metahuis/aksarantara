-- Add bio, photo, and optional profile link to speakers table
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS bio       TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);

-- Allow contributors to update their own speaker record (when they are the speaker)
CREATE POLICY "speakers_self_update" ON speakers
  FOR UPDATE USING (
    profile_id = auth.uid()
  );
