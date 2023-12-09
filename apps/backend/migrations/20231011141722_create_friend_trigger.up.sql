-- Insert
--
CREATE OR REPLACE FUNCTION friend_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
DECLARE
	incoming_friend_requests_value SMALLINT;
BEGIN
	-- Sanity check
	IF (NEW.transmitter_id = NEW.receiver_id) THEN
		RAISE 'Source user is equivalent to the target user'
			USING ERRCODE = '52000';
	END IF;
	--
	-- Check whether the transmitter/receiver is soft-deleted or deactivated
	IF (
		EXISTS (SELECT 1
				FROM
					users
				WHERE
					  id IN (NEW.transmitter_id, NEW.receiver_id)
				  AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			   )
		) THEN
		RAISE 'Transmitter/receiver is either soft-deleted or deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check if the transmitter user is blocked by the receiver user
	IF (
		EXISTS (SELECT 1
				FROM
					blocks
				WHERE
					  blocker_id = NEW.receiver_id
				  AND blocked_id = NEW.transmitter_id
				  AND deleted_at IS NULL
			   )
		) THEN
		RAISE 'Source user is blocked by the target user'
			USING ERRCODE = '50003';
	END IF;
	--
	-- Check for `incoming_friend_requests` flag on the receiver
	SELECT incoming_friend_requests
	INTO incoming_friend_requests_value
	FROM
		users
	WHERE
		id = NEW.receiver_id;
	--
	IF (
		-- None
		incoming_friend_requests_value = 4 OR
			--
			-- Following
		(incoming_friend_requests_value = 2 AND NOT EXISTS (SELECT 1
															FROM
																relations
															WHERE
																  followed_id = NEW.transmitter_id
															  AND follower_id = NEW.receiver_id
															  AND deleted_at IS NULL
														   )) OR
			--
			-- Friend of friends
		(incoming_friend_requests_value = 3 AND
		 NOT EXISTS (WITH receiver_friends AS (SELECT transmitter_id AS user_id
											   FROM
												   friends
											   WHERE
													 (transmitter_id = NEW.receiver_id OR receiver_id = NEW.receiver_id)
												 AND accepted_at IS NOT NULL
												 AND deleted_at IS NULL
											   UNION
											   SELECT receiver_id AS user_id
											   FROM
												   friends
											   WHERE
													 (transmitter_id = NEW.receiver_id OR receiver_id = NEW.receiver_id)
												 AND accepted_at IS NOT NULL
												 AND deleted_at IS NULL
											  )
					 SELECT 1
					 FROM
						 friends
					 WHERE
						   (
							   (transmitter_id =
								NEW.transmitter_id AND
								receiver_id IN
								(SELECT user_id
								 FROM
									 receiver_friends
								))
								   OR (receiver_id = NEW.transmitter_id AND
									   transmitter_id IN
									   (SELECT user_id
										FROM
											receiver_friends
									   )))
					   AND accepted_at IS NOT NULL
					   AND deleted_at IS NULL
					 LIMIT 1
					))
		) THEN
		RAISE 'Target user is not accepting friend requests from the source user'
			USING ERRCODE = '51000';
	END IF;
	--
	-- Delete existing inverse friend relation
	DELETE
	FROM
		friends
	WHERE
		  transmitter_id = NEW.receiver_id
	  AND receiver_id = NEW.transmitter_id;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER friend_insert_trigger
	BEFORE INSERT
	ON friends
	FOR EACH ROW
EXECUTE PROCEDURE friend_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION friend_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Friend request accepted, increment `friend_count`
	IF (OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL) THEN
		UPDATE
			users
		SET
			friend_count = friend_count + 1
		WHERE
			id IN (NEW.transmitter_id, NEW.receiver_id);
		--
		RETURN NEW;
	END IF;
	--
	-- Only update the counter cache for accepted friends
	IF (NEW.accepted_at IS NOT NULL) THEN
		-- Friend soft-deleted
		IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
			-- Decrement `friend_count`
			UPDATE
				users
			SET
				friend_count = friend_count - 1
			WHERE
				  id IN (NEW.transmitter_id, NEW.receiver_id)
			  AND friend_count > 0;
			--
			-- Delete notifications
			DELETE
			FROM
				notifications
			WHERE
				entity_id = OLD.transmitter_id;
			--
			RETURN NEW;
		END IF;
		--
		-- Friend recovered
		IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
			-- Increment `friend_count`
			UPDATE
				users
			SET
				friend_count = friend_count + 1
			WHERE
				id IN (NEW.transmitter_id, NEW.receiver_id);
			--
		END IF;
	END IF;
	-- Friend soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Delete notifications
		DELETE
		FROM
			notifications
		WHERE
			entity_id = NEW.transmitter_id;
	END IF;
	--
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER friend_update_trigger
	BEFORE UPDATE
	ON friends
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR OLD.accepted_at IS DISTINCT FROM NEW.accepted_at)
EXECUTE PROCEDURE friend_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION friend_delete_trigger_proc(
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
		entity_id = OLD.transmitter_id;
	--
	IF (OLD.accepted_at IS NOT NULL) THEN
		-- Decrement `friend_count`
		UPDATE
			users
		SET
			friend_count = friend_count - 1
		WHERE
			  id IN (OLD.transmitter_id, OLD.receiver_id)
		  AND friend_count > 0;
	END IF;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER friend_delete_trigger
	AFTER DELETE
	ON friends
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the friend is directly deleted
EXECUTE PROCEDURE friend_delete_trigger_proc();

