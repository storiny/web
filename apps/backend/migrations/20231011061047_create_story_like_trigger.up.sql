-- Insert
--
CREATE OR REPLACE FUNCTION story_like_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the story is soft-deleted/unpublished or the user is soft-deleted/deactivated
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
		RAISE 'Story is soft-deleted/unpublished or user is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_like_before_insert_trigger
	BEFORE INSERT
	ON story_likes
	FOR EACH ROW
EXECUTE PROCEDURE story_like_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION story_like_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
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

CREATE OR REPLACE TRIGGER story_like_after_insert_trigger
	AFTER INSERT
	ON story_likes
	FOR EACH ROW
EXECUTE PROCEDURE story_like_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION story_like_before_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Story like soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Delete the notification
		DELETE
		FROM
			notifications n USING notification_outs nu
		WHERE
			  nu.notification_id = n.id
			  -- Story like
		  AND n.entity_type = 9
		  AND n.entity_id = NEW.story_id
		  AND nu.notified_id = NEW.user_id;
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
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
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
	BEFORE UPDATE
	ON story_likes
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE story_like_before_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION story_like_delete_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Delete the notification
	DELETE
	FROM
		notifications n USING notification_outs nu
	WHERE
		  nu.notification_id = n.id
		  -- Story like
	  AND n.entity_type = 9
	  AND n.entity_id = OLD.story_id
	  AND nu.notified_id = OLD.user_id;
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
	AFTER DELETE
	ON story_likes
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the story like is directly deleted
EXECUTE PROCEDURE story_like_delete_trigger_proc();

