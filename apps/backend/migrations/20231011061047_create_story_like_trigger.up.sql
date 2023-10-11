-- Insert
--
CREATE OR REPLACE FUNCTION story_like_insert_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Increment `like_count` on story
    UPDATE
        stories
    SET
        like_count = like_count + 1
    WHERE
        id = NEW.story_id;
    --
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_like_insert_trigger
    AFTER INSERT ON story_likes
    FOR EACH ROW
    EXECUTE PROCEDURE story_like_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION story_like_before_update_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Story like soft-deleted
    IF(OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
        -- Decrement `like_count` on story
        UPDATE
            stories
        SET
            like_count = like_count - 1
        WHERE
            id = NEW.story_id
            AND like_count > 0;
        --
        RETURN NEW;
        --
    END IF;
    --
    -- Story like recovered
    IF(OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
        -- Increment `like_count` on story
        UPDATE
            stories
        SET
            like_count = like_count + 1
        WHERE
            id = NEW.story_id;
        --
    END IF;
    --
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_like_before_update_trigger
    BEFORE UPDATE ON story_likes
    FOR EACH ROW
    WHEN(OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
    EXECUTE PROCEDURE story_like_before_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION story_like_delete_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Decrement `like_count` on story
    UPDATE
        stories
    SET
        like_count = like_count - 1
    WHERE
        id = OLD.story_id
        AND like_count > 0;
    --
    RETURN OLD;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_like_delete_trigger
    AFTER DELETE ON story_likes
    FOR EACH ROW
    WHEN(OLD.deleted_at IS NULL) -- Only run when the story like is directly deleted
    EXECUTE PROCEDURE story_like_delete_trigger_proc();

