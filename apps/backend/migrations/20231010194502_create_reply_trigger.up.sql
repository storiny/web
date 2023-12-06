-- Insert
--
CREATE OR REPLACE FUNCTION reply_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the comment is soft-deleted or the reply writer is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   comments
			   WHERE
					 id = NEW.comment_id
				 AND deleted_at IS NOT NULL
			  ) OR EXISTS(SELECT 1
						  FROM
							  users
						  WHERE
								id = NEW.user_id
							AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
						 )) THEN
		RAISE 'Comment is soft-deleted or reply writer is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check if the user is blocked by the comment writer
	IF (EXISTS(SELECT 1
			   FROM
				   comments c
			   WHERE
					 c.id = NEW.comment_id
				 AND EXISTS(SELECT 1
							FROM
								blocks b
							WHERE
								  b.blocker_id = c.user_id
							  AND b.blocked_id = NEW.user_id
							  AND c.deleted_at IS NULL
						   )
			  )) THEN
		RAISE 'User is blocked by the comment writer'
			USING ERRCODE = '50001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_before_insert_trigger
	BEFORE INSERT
	ON replies
	FOR EACH ROW
EXECUTE PROCEDURE reply_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION reply_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Increment `reply_count` on comment
	UPDATE
		comments
	SET
		reply_count = reply_count + 1
	WHERE
		id = NEW.comment_id;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_after_insert_trigger
	AFTER INSERT
	ON replies
	FOR EACH ROW
EXECUTE PROCEDURE reply_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION reply_before_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Reply soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Decrement `reply_count` on comment
		UPDATE
			comments
		SET
			reply_count = reply_count - 1
		WHERE
			  id = NEW.comment_id
		  AND reply_count > 0;
		--
		RETURN NEW;
		--
	END IF;
	--
	-- Reply recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Increment `reply_count` on comment
		UPDATE
			comments
		SET
			reply_count = reply_count + 1
		WHERE
			id = NEW.comment_id;
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_before_update_trigger
	BEFORE UPDATE
	ON replies
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE reply_before_update_trigger_proc();

--
CREATE OR REPLACE FUNCTION reply_after_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Reply soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Soft-delete reply likes
		UPDATE
			reply_likes
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND reply_id = NEW.id;
		--
		-- Delete notifications
		DELETE
		FROM
			notifications
		WHERE
			entity_id = NEW.id;
		--
		RETURN NEW;
		--
	END IF;
	--
	-- Reply recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Restore reply likes
		UPDATE
			reply_likes AS rl
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND rl.reply_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = rl.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_after_update_trigger
	AFTER UPDATE
	ON replies
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE reply_after_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION reply_delete_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Delete notifications
	DELETE
	FROM
		notifications
	WHERE
		entity_id = OLD.id;
	--
	-- Decrement `reply_count` on comment
	UPDATE
		comments
	SET
		reply_count = reply_count - 1
	WHERE
		  id = OLD.comment_id
	  AND reply_count > 0;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_delete_trigger
	AFTER DELETE
	ON replies
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the reply is directly deleted
EXECUTE PROCEDURE reply_delete_trigger_proc();

