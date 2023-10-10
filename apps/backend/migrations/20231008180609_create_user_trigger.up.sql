-- Update
--
CREATE OR REPLACE FUNCTION user_update_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- User deactivated or soft-deleted
    IF((OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR(OLD.deactivated_at IS NULL AND NEW.deactivated_at IS NOT NULL)) THEN
        -- Soft-delete stories
        UPDATE
            stories
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND user_id = NEW.id;
        --
        -- Soft-delete comments
        UPDATE
            comments
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND user_id = NEW.id;
        --
        -- Soft-delete replies
        UPDATE
            replies
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND user_id = NEW.id;
        --
        -- Soft-delete relations
        UPDATE
            relations
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND(follower_id = NEW.id
                OR followed_id = NEW.id);
        --
        -- Soft-delete friends
        UPDATE
            friends
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND(transmitter_id = NEW.id
                OR receiver_id = NEW.id);
        --
        -- Soft-delete story likes
        UPDATE
            story_likes
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND user_id = NEW.id;
        --
        -- Soft-delete comment likes
        UPDATE
            comment_likes
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND user_id = NEW.id;
        --
        -- Soft-delete reply likes
        UPDATE
            reply_likes
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND user_id = NEW.id;
        --
        -- Soft-delete tag follows
        UPDATE
            tag_followers
        SET
            deleted_at = now()
        WHERE
            deleted_at IS NULL
            AND user_id = NEW.id;
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
            deleted_at IS NOT NULL
            AND user_id = NEW.id;
        --
        -- Restore comments
        UPDATE
            comments AS c
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND c.user_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    stories AS s
                WHERE
                    s.id = c.story_id
                    AND s.deleted_at IS NULL);
        --
        -- Restore replies
        UPDATE
            replies AS r
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND r.user_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    comments AS c
                WHERE
                    c.id = r.comment_id
                    AND c.deleted_at IS NULL);
        --
        -- Restore relations
        UPDATE
            relations AS r
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND((r.follower_id = NEW.id
                    AND EXISTS(
                        SELECT
                            1
                        FROM
                            users AS u
                        WHERE
                            u.id = r.followed_id
                            AND u.deleted_at IS NULL
                            AND u.deactivated_at IS NULL))
                    OR(r.followed_id = NEW.id
                        AND EXISTS(
                            SELECT
                                1
                            FROM
                                users AS u
                            WHERE
                                u.id = r.follower_id
                                AND u.deleted_at IS NULL
                                AND u.deactivated_at IS NULL)));
        --
        -- Restore friends
        UPDATE
            friends AS f
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND((f.transmitter_id = NEW.id
                    AND EXISTS(
                        SELECT
                            1
                        FROM
                            users AS u
                        WHERE
                            u.id = f.receiver_id
                            AND u.deleted_at IS NULL
                            AND u.deactivated_at IS NULL))
                    OR(f.receiver_id = NEW.id
                        AND EXISTS(
                            SELECT
                                1
                            FROM
                                users AS u
                            WHERE
                                u.id = f.transmitter_id
                                AND u.deleted_at IS NULL
                                AND u.deactivated_at IS NULL)));
        --
        -- Restore story likes
        UPDATE
            story_likes AS sl
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND sl.user_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    stories AS s
                WHERE
                    s.id = sl.story_id
                    AND s.deleted_at IS NULL);
        --
        -- Restore comment likes
        UPDATE
            comment_likes AS cl
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND cl.user_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    comments AS c
                WHERE
                    c.id = cl.comment_id
                    AND c.deleted_at IS NULL);
        --
        -- Restore reply likes
        UPDATE
            reply_likes AS rl
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND rl.user_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    replies AS r
                WHERE
                    r.id = rl.reply_id
                    AND r.deleted_at IS NULL);
        --
        -- Restore tag follows
        UPDATE
            tag_followers AS tf
        SET
            deleted_at = NULL
        WHERE
            deleted_at IS NOT NULL
            AND tf.user_id = NEW.id
            AND EXISTS(
                SELECT
                    1
                FROM
                    tags AS t
                WHERE
                    t.id = tf.tag_id);
    END IF;
    --
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_update_trigger
    AFTER UPDATE OF deleted_at,
    deactivated_at ON users
    FOR EACH ROW
    EXECUTE PROCEDURE user_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION user_delete_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    -- Delete notifications with matching `entity_id`
    DELETE FROM notifications
    WHERE entity_id = OLD.id;
    --
    RETURN OLD;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_delete_trigger
    AFTER DELETE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE user_delete_trigger_proc();

