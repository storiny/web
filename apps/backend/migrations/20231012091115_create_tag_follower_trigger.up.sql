-- Insert
--
CREATE OR REPLACE FUNCTION tag_follower_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the user is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id = NEW.user_id
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'User is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tag_follower_before_insert_trigger
	BEFORE INSERT
	ON tag_followers
	FOR EACH ROW
EXECUTE PROCEDURE tag_follower_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION tag_follower_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Increment `follower_count` on tag
	UPDATE
		tags
	SET
		follower_count = follower_count + 1
	WHERE
		id = NEW.tag_id;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tag_follower_after_insert_trigger
	AFTER INSERT
	ON tag_followers
	FOR EACH ROW
EXECUTE PROCEDURE tag_follower_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION tag_follower_before_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Tag follower soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Decrement `follower_count` on tag
		UPDATE
			tags
		SET
			follower_count = follower_count - 1
		WHERE
			  id = NEW.tag_id
		  AND follower_count > 0;
		--
		RETURN NEW;
		--
	END IF;
	--
	-- Tag follower recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Increment `follower_count` on tag
		UPDATE
			tags
		SET
			follower_count = follower_count + 1
		WHERE
			id = NEW.tag_id;
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tag_follower_before_update_trigger
	BEFORE UPDATE
	ON tag_followers
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE tag_follower_before_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION tag_follower_delete_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Decrement `follower_count` on tag
	UPDATE
		tags
	SET
		follower_count = follower_count - 1
	WHERE
		  id = OLD.tag_id
	  AND follower_count > 0;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tag_follower_delete_trigger
	AFTER DELETE
	ON tag_followers
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the tag follower is directly deleted
EXECUTE PROCEDURE tag_follower_delete_trigger_proc();

