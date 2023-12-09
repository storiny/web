-- Insert
--
CREATE OR REPLACE FUNCTION block_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Sanity check
	IF (NEW.blocker_id = NEW.blocked_id) THEN
		RAISE 'Source user is equivalent to the target user'
			USING ERRCODE = '52000';
	END IF;
	--
	-- Check whether the blocker/blocked user is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id IN (NEW.blocker_id, NEW.blocked_id)
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'Blocker/blocked user is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER block_before_insert_trigger
	BEFORE INSERT
	ON blocks
	FOR EACH ROW
EXECUTE PROCEDURE block_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION block_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Delete relations
	DELETE
	FROM
		relations
	WHERE
		 (follower_id = NEW.blocker_id
			 AND followed_id = NEW.blocked_id)
	  OR (follower_id = NEW.blocked_id
		AND followed_id = NEW.blocker_id);
	-- Delete friends
	DELETE
	FROM
		friends
	WHERE
		 (transmitter_id = NEW.blocker_id
			 AND receiver_id = NEW.blocked_id)
	  OR (transmitter_id = NEW.blocked_id
		AND receiver_id = NEW.blocker_id);
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER block_after_insert_trigger
	AFTER INSERT
	ON blocks
	FOR EACH ROW
EXECUTE PROCEDURE block_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION block_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Block recovered
	--
	-- This is just for safety as follower and friend relations
	-- cannot be created unless the target user is unblocked
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Delete relations
		DELETE
		FROM
			relations
		WHERE
			 (follower_id = NEW.blocker_id
				 AND followed_id = NEW.blocked_id)
		  OR (follower_id = NEW.blocked_id
			AND followed_id = NEW.blocker_id);
		-- Delete friends
		DELETE
		FROM
			friends
		WHERE
			 (transmitter_id = NEW.blocker_id
				 AND receiver_id = NEW.blocked_id)
		  OR (transmitter_id = NEW.blocked_id
			AND receiver_id = NEW.blocker_id);
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER block_update_trigger
	AFTER UPDATE
	ON blocks
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE block_update_trigger_proc();

