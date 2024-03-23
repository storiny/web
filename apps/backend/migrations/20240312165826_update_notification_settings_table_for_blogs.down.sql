ALTER TABLE notification_settings
	DROP COLUMN IF EXISTS push_collaboration_requests;

ALTER TABLE notification_settings
	DROP COLUMN IF EXISTS push_blog_requests;
