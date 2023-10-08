CREATE TABLE IF NOT EXISTS story_tags(
    story_id BIGINT REFERENCES stories(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, tag_id)
);

