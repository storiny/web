CREATE TABLE IF NOT EXISTS notifications(
    id BIGINT PRIMARY KEY DEFAULT public.next_snowflake(),
    entity_id BIGINT NOT NULL, -- ID of the main entity of the notification
    entity_type SMALLINT NOT NULL, -- Notification type enum
    notifier_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE -- Can be NULL for system notifications
);

