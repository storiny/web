CREATE TABLE IF NOT EXISTS mutes(
    muter_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    muted_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (muter_id, muted_id)
);

