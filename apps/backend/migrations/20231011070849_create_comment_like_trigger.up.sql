-- Insert
--
CREATE OR REPLACE FUNCTION comment_like_insert_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Increment `like_count` on comment
    UPDATE
        comments
    SET
        like_count = like_count + 1
    WHERE
        id = NEW.comment_id;
    --
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER comment_like_insert_trigger
    AFTER INSERT ON comment_likes
    FOR EACH ROW
    EXECUTE PROCEDURE comment_like_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION comment_like_before_update_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Comment like soft-deleted
    IF(OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
        -- Decrement `like_count` on comment
        UPDATE
            comments
        SET
            like_count = like_count - 1
        WHERE
            id = NEW.comment_id
            AND like_count > 0;
        --
        RETURN NEW;
        --
    END IF;
    --
    -- Comment like recovered
    IF(OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
        -- Increment `like_count` on comment
        UPDATE
            comments
        SET
            like_count = like_count + 1
        WHERE
            id = NEW.comment_id;
        --
    END IF;
    --
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER comment_like_before_update_trigger
    BEFORE UPDATE ON comment_likes
    FOR EACH ROW
    WHEN(OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
    EXECUTE PROCEDURE comment_like_before_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION comment_like_delete_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Decrement `like_count` on comment
    UPDATE
        comments
    SET
        like_count = like_count - 1
    WHERE
        id = OLD.comment_id
        AND like_count > 0;
    --
    RETURN OLD;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER comment_like_delete_trigger
    AFTER DELETE ON comment_likes
    FOR EACH ROW
    WHEN(OLD.deleted_at IS NULL) -- Only run when the comment like is directly deleted
    EXECUTE PROCEDURE comment_like_delete_trigger_proc();

