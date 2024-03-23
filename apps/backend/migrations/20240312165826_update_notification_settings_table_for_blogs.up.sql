ALTER TABLE notification_settings
	ADD COLUMN IF NOT EXISTS
		push_collaboration_requests BOOL NOT NULL DEFAULT TRUE;

ALTER TABLE notification_settings
	ADD COLUMN IF NOT EXISTS
		push_blog_requests BOOL NOT NULL DEFAULT TRUE;
