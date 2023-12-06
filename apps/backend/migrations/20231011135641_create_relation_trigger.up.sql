-- Insert
--
CREATE OR REPLACE FUNCTION relation_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Sanity check
	IF (NEW.follower_id = NEW.followed_id) THEN
		RAISE 'Source user is equivalent to the target user'
			USING ERRCODE = '52000';
	END IF;
	--
	-- Check whether the follower/followed user is soft-deleted or deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id IN (NEW.follower_id, NEW.followed_id)
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'Follower/followed user is either soft-deleted or deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check if the follower user is blocked by the followed user
	IF (EXISTS(SELECT 1
			   FROM
				   blocks
			   WHERE
					 blocker_id = NEW.followed_id
				 AND blocked_id = NEW.follower_id
				 AND deleted_at IS NULL
			  )) THEN
		RAISE 'Source user is blocked by the target user'
			USING ERRCODE = '50002';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER relation_before_insert_trigger
	BEFORE INSERT
	ON relations
	FOR EACH ROW
EXECUTE PROCEDURE relation_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION relation_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Increment `following_count` on follower user
	UPDATE
		users
	SET
		following_count = following_count + 1
	WHERE
		id = NEW.follower_id;
	--
	-- Increment `follower_count` on followed user
	UPDATE
		users
	SET
		follower_count = follower_count + 1
	WHERE
		id = NEW.followed_id;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER relation_after_insert_trigger
	AFTER INSERT
	ON relations
	FOR EACH ROW
EXECUTE PROCEDURE relation_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION relation_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Relation soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Decrement `following_count` on follower user
		UPDATE
			users
		SET
			following_count = following_count - 1
		WHERE
			  id = NEW.follower_id
		  AND following_count > 0;
		--
		-- Decrement `follower_count` on followed user
		UPDATE
			users
		SET
			follower_count = follower_count - 1
		WHERE
			  id = NEW.followed_id
		  AND follower_count > 0;
		--
		-- Delete notifications
		DELETE
		FROM
			notifications
		WHERE
			entity_id = OLD.follower_id;
		--
		RETURN NEW;
	END IF;
	--
	-- Relation recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Increment `following_count` on follower user
		UPDATE
			users
		SET
			following_count = following_count + 1
		WHERE
			id = NEW.follower_id;
		--
		-- Increment `follower_count` on followed user
		UPDATE
			users
		SET
			follower_count = follower_count + 1
		WHERE
			id = NEW.followed_id;
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER relation_update_trigger
	BEFORE UPDATE
	ON relations
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE relation_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION relation_delete_trigger_proc(
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
		entity_id = OLD.follower_id;
	--
	-- Decrement `following_count` on follower user
	UPDATE
		users
	SET
		following_count = following_count - 1
	WHERE
		  id = OLD.follower_id
	  AND following_count > 0;
	--
	-- Decrement `follower_count` on followed user
	UPDATE
		users
	SET
		follower_count = follower_count - 1
	WHERE
		  id = OLD.followed_id
	  AND follower_count > 0;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER relation_delete_trigger
	AFTER DELETE
	ON relations
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the relation is directly deleted
EXECUTE PROCEDURE relation_delete_trigger_proc();

