ALTER TABLE assets
	DROP COLUMN IF EXISTS user_id;

DROP INDEX IF EXISTS user_id_on_assets;