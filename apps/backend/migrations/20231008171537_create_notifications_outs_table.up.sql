CREATE TABLE IF NOT EXISTS notification_outs
(
	notified_id      BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	notification_id  BIGINT      NOT NULL
		REFERENCES notifications (id)
			ON DELETE CASCADE,
	rendered_content TEXT
		CONSTRAINT rendered_content_length CHECK (CHAR_LENGTH(rendered_content) <= 1024), -- Custom text content for system notifications
	created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	read_at          TIMESTAMPTZ,
	PRIMARY KEY (notification_id, notified_id)
);

CREATE INDEX notified_id_on_notification_outs ON notification_outs (notified_id);

CREATE INDEX created_at_on_notification_outs ON notification_outs (created_at);

