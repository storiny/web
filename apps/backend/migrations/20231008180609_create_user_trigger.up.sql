CREATE OR REPLACE FUNCTION user_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    IF(TG_OP = 'UPDATE') THEN
        -- User deactivated or soft-deleted
        IF((OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR(OLD.deactivated_at IS NULL AND NEW.deactivated_at IS NOT NULL)) THEN
            -- Soft-delete stories
            UPDATE
                stories
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete comments
            UPDATE
                comments
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete replies
            UPDATE
                replies
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete relations
            UPDATE
                relations
            SET
                deleted_at = now()
            WHERE
                follower_id = NEW.id
                OR followed_id = NEW.id;
            --
            -- Soft-delete friends
            UPDATE
                friends
            SET
                deleted_at = now()
            WHERE
                transmitter_id = NEW.id
                OR receiver_id = NEW.id;
            --
            -- Soft-delete assets
            UPDATE
                assets
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete story likes
            UPDATE
                story_likes
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete comment likes
            UPDATE
                comment_likes
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete reply likes
            UPDATE
                reply_likes
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete tag follows
            UPDATE
                tag_followers
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Delete notifications
            DELETE FROM notifications
            WHERE notifier_id = NEW.id
                OR entity_id = NEW.id;
            DELETE FROM notification_outs
            WHERE notified_id = NEW.id;
        END IF;
        --
        -- User recovered or re-activated
        IF((OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) OR(OLD.deactivated_at IS NOT NULL AND NEW.deactivated_at IS NULL)) THEN
            -- Restore stories
            UPDATE
                stories
            SET
                deleted_at = NULL
            WHERE
                user_id = NEW.id;
            --
            -- Restore comments
            UPDATE
                comments
            SET
                deleted_at = NULL
            WHERE
                user_id = NEW.id
                AND(
                    SELECT
                        stories.deleted_at
                    FROM
                        stories
                    WHERE
                        id = story_id) IS NULL;
            --
            -- Soft-delete replies
            UPDATE
                replies
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete relations
            UPDATE
                relations
            SET
                deleted_at = now()
            WHERE
                follower_id = NEW.id
                OR followed_id = NEW.id;
            --
            -- Soft-delete friends
            UPDATE
                friends
            SET
                deleted_at = now()
            WHERE
                transmitter_id = NEW.id
                OR receiver_id = NEW.id;
            --
            -- Soft-delete assets
            UPDATE
                assets
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete story likes
            UPDATE
                story_likes
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete comment likes
            UPDATE
                comment_likes
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete reply likes
            UPDATE
                reply_likes
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Soft-delete tag follows
            UPDATE
                tag_followers
            SET
                deleted_at = now()
            WHERE
                user_id = NEW.id;
            --
            -- Delete notifications
            DELETE FROM notifications
            WHERE notifier_id = NEW.id
                OR entity_id = NEW.id;
            DELETE FROM notification_outs
            WHERE notified_id = NEW.id;
        END IF;
        --
        RETURN NEW;
    ELSIF(TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_trigger
    AFTER UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE user_trigger_proc();

