-- Insert
--
CREATE OR REPLACE FUNCTION comment_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the story is soft-deleted/unpublished or the comment writer is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   stories
			   WHERE
					 id = NEW.story_id
				 AND (deleted_at IS NOT NULL
				   OR published_at IS NULL)
			  ) OR EXISTS(SELECT 1
						  FROM
							  users
						  WHERE
								id = NEW.user_id
							AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
						 )) THEN
		RAISE 'Story is soft-deleted/unpublished or comment writer is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check if the user is blocked by the story writer
	IF (EXISTS(SELECT 1
			   FROM
				   stories s
			   WHERE
					 s.id = NEW.story_id
				 AND EXISTS(SELECT 1
							FROM
								blocks b
							WHERE
								  b.blocker_id = s.user_id
							  AND b.blocked_id = NEW.user_id
							  AND b.deleted_at IS NULL
						   )
			  )) THEN
		RAISE 'User is blocked by the story writer'
			USING ERRCODE = '50000';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER comment_before_insert_trigger
	BEFORE INSERT
	ON comments
	FOR EACH ROW
EXECUTE PROCEDURE comment_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION comment_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Increment `comment_count` on story
	UPDATE
		stories
	SET
		comment_count = comment_count + 1
	WHERE
		id = NEW.story_id;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER comment_after_insert_trigger
	AFTER INSERT
	ON comments
	FOR EACH ROW
EXECUTE PROCEDURE comment_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION comment_before_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Comment soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Decrement `comment_count` on story
		UPDATE
			stories
		SET
			comment_count = comment_count - 1
		WHERE
			  id = NEW.story_id
		  AND comment_count > 0;
		--
		RETURN NEW;
		--
	END IF;
	--
	-- Comment recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Increment `comment_count` on story
		UPDATE
			stories
		SET
			comment_count = comment_count + 1
		WHERE
			id = NEW.story_id;
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER comment_before_update_trigger
	BEFORE UPDATE
	ON comments
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE comment_before_update_trigger_proc();

--
CREATE OR REPLACE FUNCTION comment_after_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Comment soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Soft-delete replies
		UPDATE
			replies
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND comment_id = NEW.id;
		--
		-- Soft-delete comment likes
		UPDATE
			comment_likes
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND comment_id = NEW.id;
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
	-- Comment recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Restore replies
		UPDATE
			replies AS r
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND r.comment_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = r.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		--
		-- Restore comment likes
		UPDATE
			comment_likes AS cl
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND cl.comment_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = cl.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER comment_after_update_trigger
	AFTER UPDATE
	ON comments
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE comment_after_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION comment_delete_trigger_proc(
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
	-- Decrement `comment_count` on story
	UPDATE
		stories
	SET
		comment_count = comment_count - 1
	WHERE
		  id = OLD.story_id
	  AND comment_count > 0;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER comment_delete_trigger
	AFTER DELETE
	ON comments
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the comment is directly deleted
EXECUTE PROCEDURE comment_delete_trigger_proc();

