ALTER TABLE stories
	-- Used to identify whether to recover a story when recovering a user.
	-- This is set to true if the story or draft was manually deleted by
	-- the user.
	ADD COLUMN IF NOT EXISTS is_deleted_by_user BOOL;
