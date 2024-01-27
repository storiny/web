ALTER TABLE users
	ADD COLUMN IF NOT EXISTS
		incoming_collaboration_requests SMALLINT NOT NULL DEFAULT 1 -- 1 (everyone) by default
;
