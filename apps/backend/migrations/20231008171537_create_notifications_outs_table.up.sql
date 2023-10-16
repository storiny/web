CREATE TABLE IF NOT EXISTS notification_outs(
    notified_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    rendered_content TEXT CONSTRAINT rendered_content_length CHECK (char_length(rendered_content) <= 1024), -- Custom text content for system notifications
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ,
    PRIMARY KEY (notification_id, notified_id)
);

create index notified_id_on_notification_outs on notification_outs(notified_id);

CREATE index created_at_on_notification_outs on notification_outs(created_at);