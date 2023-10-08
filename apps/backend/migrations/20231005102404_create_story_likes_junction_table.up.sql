CREATE TABLE IF NOT EXISTS story_likes(
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    story_id BIGINT REFERENCES stories(id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, story_id)
);

-- Counter cache
CREATE OR REPLACE FUNCTION story_like_count_counter_cache()
    RETURNS TRIGGER
    AS $$
BEGIN
    IF(TG_OP = 'INSERT') THEN
        UPDATE
            stories
        SET
            like_count = like_count + 1
        WHERE
            id = NEW.story_id;
        RETURN NEW;
    ELSIF(TG_OP = 'DELETE') THEN
        UPDATE
            stories
        SET
            like_count = like_count - 1
        WHERE
            id = OLD.story_id
            AND like_count > 0;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER refresh_story_like_count
    AFTER INSERT OR DELETE ON "public"."story_likes"
    FOR EACH ROW
    EXECUTE PROCEDURE story_like_count_counter_cache();

