ALTER TABLE assets
	-- Avoid cascade action as it will result in orphaned objects in S3
	ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX user_id_on_assets ON assets (user_id);