-- Update
--
CREATE OR REPLACE FUNCTION story_before_update_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Story soft-deleted or unpublished
    IF((OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR(OLD.published_at IS NOT NULL AND NEW.published_at IS NULL)) THEN
        -- Reset `read_count` as a penalty
        NEW.read_count := 0;
        NEW.published_at := NULL;
        NEW.edited_at := NULL;
        --
        -- Do not reset `first_published_at` on unpublish as it helps in keeping track of whether the story was unpublished
        IF(OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
            NEW.first_published_at := NULL;
        END IF;
        --
        -- Decrement `story_count` on user if the story was previously published
        IF(OLD.published_at IS NOT NULL) THEN
            UPDATE
                users
            SET
                story_count = story_count - 1
            WHERE
                id = NEW.user_id
                AND story_count > 0;
        END IF;
        --
        RETURN NEW;
        --
    END IF;
    --
    -- Story recovered or published
    IF((OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) OR(OLD.published_at IS NULL AND NEW.published_at IS NOT NULL)) THEN
        -- Update `first_published_at` and `story_count` on publishing the story
        IF(OLD.published_at IS NULL AND NEW.published_at IS NOT NULL) THEN
            NEW.first_published_at := NEW.published_at;
            --
            -- Increment `story_count` on user
            UPDATE
                users
            SET
                story_count = story_count + 1
            WHERE
                id = NEW.user_id;
        END IF;
        --
    END IF;
    --
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_before_update_trigger
    BEFORE UPDATE ON stories
    FOR EACH ROW
    WHEN(OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR OLD.published_at IS DISTINCT FROM NEW.published_at)
    EXECUTE PROCEDURE story_before_update_trigger_proc();

--
CREATE OR REPLACE FUNCTION story_after_update_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Story soft-deleted or unpublished
    IF((OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR(OLD.published_at IS NOT NULL AND NEW.published_at IS NULL)) THEN
        -- Soft-delete comments
        UPDATE
            comments
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND story_id = NEW.id;
        --
        -- Soft-delete story likes
        UPDATE
            story_likes
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND story_id = NEW.id;
        --
        -- Soft-delete story tags
        UPDATE
            story_tags
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND story_id = NEW.id;
        --
        -- Soft-delete bookmarks
        UPDATE
            bookmarks
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND story_id = NEW.id;
        --
        -- Soft-delete histories
        UPDATE
            histories
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND story_id = NEW.id;
        --
        -- Delete notifications
        DELETE FROM notifications
        WHERE entity_id = NEW.id;
        --
        RETURN NEW;
        --
    END IF;
    --
    -- Story recovered or published
    IF((OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) OR(OLD.published_at IS NULL AND NEW.published_at IS NOT NULL)) THEN
        -- Restore comments
        UPDATE
            comments AS c
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND c.story_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    users AS u
                WHERE
                    u.id = c.user_id
                    AND u.deleted_at IS NULL
                    AND u.deactivated_at IS NULL);
        --
        -- Restore story likes
        UPDATE
            story_likes AS sl
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND sl.story_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    users AS u
                WHERE
                    u.id = sl.user_id
                    AND u.deleted_at IS NULL
                    AND u.deactivated_at IS NULL);
        --
        -- Restore story tags
        UPDATE
            story_tags AS st
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND st.story_id = NEW.id;
        --
        -- Restore bookmarks
        UPDATE
            bookmarks AS b
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND b.story_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    users AS u
                WHERE
                    u.id = b.user_id
                    AND u.deleted_at IS NULL
                    AND u.deactivated_at IS NULL);
        --
        -- Restore histories
        UPDATE
            histories AS h
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND h.story_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    users AS u
                WHERE
                    u.id = h.user_id
                    AND u.deleted_at IS NULL
                    AND u.deactivated_at IS NULL);
    END IF;
    --
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_after_update_trigger
    AFTER UPDATE ON stories
    FOR EACH ROW
    WHEN(OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR OLD.published_at IS DISTINCT FROM NEW.published_at)
    EXECUTE PROCEDURE story_after_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION story_delete_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Delete notifications
    DELETE FROM notifications
    WHERE entity_id = OLD.id;
    --
    -- Decrement `story_count` on user if the story was previously published
    IF(OLD.published_at IS NOT NULL) THEN
        UPDATE
            users
        SET
            story_count = story_count - 1
        WHERE
            id = OLD.user_id
            AND story_count > 0;
    END IF;
    --
    RETURN OLD;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_delete_trigger
    AFTER DELETE ON stories
    FOR EACH ROW
    WHEN(OLD.deleted_at IS NULL) -- Only run when the story is directly deleted
    EXECUTE PROCEDURE story_delete_trigger_proc();

