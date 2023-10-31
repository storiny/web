CREATE TABLE IF NOT EXISTS notifications
(
	id          BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
	entity_type SMALLINT NOT NULL, -- Notification type enum
	entity_id   BIGINT,            -- ID of the main entity of the notification (NULL for system notifications)
	notifier_id BIGINT
		REFERENCES users (id)
			ON DELETE CASCADE      -- Can be NULL for system notifications
);

CREATE INDEX entity_id_on_notifications ON notifications (entity_id);

