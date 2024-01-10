CREATE OR REPLACE FUNCTION user_after_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- User deactivated or soft-deleted
	IF ((OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR
		(OLD.deactivated_at IS NULL AND NEW.deactivated_at IS NOT NULL)) THEN
		-- Soft-delete stories
		UPDATE
			stories
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete comments
		UPDATE
			comments
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete replies
		UPDATE
			replies
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete relations
		UPDATE
			relations
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND (follower_id = NEW.id
			OR followed_id = NEW.id);
		--
		-- Soft-delete friends
		UPDATE
			friends
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND (transmitter_id = NEW.id
			OR receiver_id = NEW.id);
		--
		-- Soft-delete story likes
		UPDATE
			story_likes
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete comment likes
		UPDATE
			comment_likes
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete reply likes
		UPDATE
			reply_likes
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete tag follows
		UPDATE
			tag_followers
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete bookmarks
		UPDATE
			bookmarks
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete histories
		UPDATE
			histories
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND user_id = NEW.id;
		--
		-- Soft-delete blocks
		UPDATE
			blocks
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND (blocker_id = NEW.id
			OR blocked_id = NEW.id);
		--
		-- Soft-delete mutes
		UPDATE
			mutes
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND (muter_id = NEW.id
			OR muted_id = NEW.id);
		--
		-- Delete notifications
		DELETE
		FROM
			notifications
		WHERE
			 notifier_id = NEW.id
		  OR entity_id = NEW.id;
		--
		DELETE
		FROM
			notification_outs
		WHERE
			notified_id = NEW.id;
		-- Delete tokens
		DELETE
		FROM
			tokens
		WHERE
			user_id = NEW.id;
		--
		RETURN NEW;
		--
	END IF;
	--
	-- User recovered or re-activated
	IF ((OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) OR
		(OLD.deactivated_at IS NOT NULL AND NEW.deactivated_at IS NULL)) THEN
		-- Restore stories
		UPDATE
			stories
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND is_deleted_by_user IS NOT TRUE
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
		  AND EXISTS(SELECT 1
					 FROM
						 stories AS s
					 WHERE
						   s.id = c.story_id
					   AND s.deleted_at IS NULL
					);
		--
		-- Restore replies
		UPDATE
			replies AS r
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND r.user_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 comments AS c
					 WHERE
						   c.id = r.comment_id
					   AND c.deleted_at IS NULL
					);
		--
		-- Restore relations
		UPDATE
			relations AS r
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND ((r.follower_id = NEW.id
			AND EXISTS(SELECT 1
					   FROM
						   users AS u
					   WHERE
							 u.id = r.followed_id
						 AND u.deleted_at IS NULL
						 AND u.deactivated_at IS NULL
					  ))
			OR (r.followed_id = NEW.id
				AND EXISTS(SELECT 1
						   FROM
							   users AS u
						   WHERE
								 u.id = r.follower_id
							 AND u.deleted_at IS NULL
							 AND u.deactivated_at IS NULL
						  )));
		--
		-- Restore friends
		UPDATE
			friends AS f
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND ((f.transmitter_id = NEW.id
			AND EXISTS(SELECT 1
					   FROM
						   users AS u
					   WHERE
							 u.id = f.receiver_id
						 AND u.deleted_at IS NULL
						 AND u.deactivated_at IS NULL
					  ))
			OR (f.receiver_id = NEW.id
				AND EXISTS(SELECT 1
						   FROM
							   users AS u
						   WHERE
								 u.id = f.transmitter_id
							 AND u.deleted_at IS NULL
							 AND u.deactivated_at IS NULL
						  )));
		--
		-- Restore story likes
		UPDATE
			story_likes AS sl
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND sl.user_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 stories AS s
					 WHERE
						   s.id = sl.story_id
					   AND s.deleted_at IS NULL
					);
		--
		-- Restore comment likes
		UPDATE
			comment_likes AS cl
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND cl.user_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 comments AS c
					 WHERE
						   c.id = cl.comment_id
					   AND c.deleted_at IS NULL
					);
		--
		-- Restore reply likes
		UPDATE
			reply_likes AS rl
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND rl.user_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 replies AS r
					 WHERE
						   r.id = rl.reply_id
					   AND r.deleted_at IS NULL
					);
		--
		-- Restore followed tags
		UPDATE
			tag_followers AS tf
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND tf.user_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 tags AS t
					 WHERE
						 t.id = tf.tag_id
					);
		--
		-- Restore bookmarks
		UPDATE
			bookmarks AS b
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND b.user_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 stories AS s
					 WHERE
						   s.id = b.story_id
					   AND s.deleted_at IS NULL
					);
		--
		-- Restore histories
		UPDATE
			histories AS h
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND h.user_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 stories AS s
					 WHERE
						   s.id = h.story_id
					   AND s.deleted_at IS NULL
					);
		--
		-- Restore blocks
		UPDATE
			blocks AS b
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND ((b.blocker_id = NEW.id
			AND EXISTS(SELECT 1
					   FROM
						   users AS u
					   WHERE
							 u.id = b.blocked_id
						 AND u.deleted_at IS NULL
						 AND u.deactivated_at IS NULL
					  ))
			OR (b.blocked_id = NEW.id
				AND EXISTS(SELECT 1
						   FROM
							   users AS u
						   WHERE
								 u.id = b.blocker_id
							 AND u.deleted_at IS NULL
							 AND u.deactivated_at IS NULL
						  )));
		-- Restore mutes
		UPDATE
			mutes AS m
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND ((m.muter_id = NEW.id
			AND EXISTS(SELECT 1
					   FROM
						   users AS u
					   WHERE
							 u.id = m.muted_id
						 AND u.deleted_at IS NULL
						 AND u.deactivated_at IS NULL
					  ))
			OR (m.muted_id = NEW.id
				AND EXISTS(SELECT 1
						   FROM
							   users AS u
						   WHERE
								 u.id = m.muter_id
							 AND u.deleted_at IS NULL
							 AND u.deactivated_at IS NULL
						  )));
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_after_update_trigger
	AFTER UPDATE
	ON users
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR OLD.deactivated_at IS DISTINCT FROM NEW.deactivated_at)
EXECUTE PROCEDURE user_after_update_trigger_proc();
