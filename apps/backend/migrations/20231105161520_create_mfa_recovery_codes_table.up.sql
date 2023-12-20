CREATE TABLE IF NOT EXISTS mfa_recovery_codes
(
	code       TEXT        NOT NULL
		CONSTRAINT code_length CHECK (CHAR_LENGTH(code) = 12),
	user_id    BIGINT      NOT NULL
		REFERENCES users (id)
			ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	used_at    TIMESTAMPTZ,
	PRIMARY KEY (user_id, code)
);

CREATE INDEX used_at_on_mfa_recovery_codes ON mfa_recovery_codes (used_at);