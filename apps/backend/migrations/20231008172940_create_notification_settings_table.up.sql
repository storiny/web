CREATE TABLE IF NOT EXISTS notification_settings
(
	user_id                   BIGINT PRIMARY KEY
		REFERENCES users (id)
			ON DELETE CASCADE, -- Allow only one row per user
	-- Push notifications
	push_features_and_updates BOOL NOT NULL DEFAULT TRUE,
	push_stories              BOOL NOT NULL DEFAULT TRUE,
	push_story_likes          BOOL NOT NULL DEFAULT TRUE,
	push_tags                 BOOL NOT NULL DEFAULT TRUE,
	push_comments             BOOL NOT NULL DEFAULT TRUE,
	push_replies              BOOL NOT NULL DEFAULT TRUE,
	push_followers            BOOL NOT NULL DEFAULT TRUE,
	push_friend_requests      BOOL NOT NULL DEFAULT TRUE,
	-- Mail notifications
	mail_login_activity       BOOL NOT NULL DEFAULT TRUE,
	mail_features_and_updates BOOL NOT NULL DEFAULT TRUE,
	mail_newsletters          BOOL NOT NULL DEFAULT TRUE,
	mail_suggested_stories    BOOL NOT NULL DEFAULT TRUE
);
