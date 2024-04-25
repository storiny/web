ALTER TABLE blogs
	ADD COLUMN IF NOT EXISTS
		subscribers_imported_at timestamptz;
