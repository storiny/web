-- Insert
--
CREATE OR REPLACE FUNCTION story_contributor_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
DECLARE
	contributor                RECORD;
	story_writer_id            BIGINT;
	contributor_limit CONSTANT SMALLINT := 3;
BEGIN
	-- Check whether the story is soft-deleted or the user is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   stories
			   WHERE
					 id = NEW.story_id
				 AND deleted_at IS NOT NULL
			  ) OR EXISTS(SELECT 1
						  FROM
							  users
						  WHERE
								id = NEW.user_id
							AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
						 )) THEN
		RAISE 'Story is soft-deleted or user is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check whether the contributor limit has been reached for the story
	IF ((SELECT COUNT(*) FROM story_contributors WHERE story_id = NEW.story_id) >= contributor_limit) THEN
		RAISE 'Maximum number of contributors reached for the story'
			USING ERRCODE = '52004';
	END IF;
	--
	SELECT user_id
	INTO story_writer_id
	FROM
		stories
	WHERE
		id = NEW.story_id;
	--
	-- Check whether the contributor's ID is same as the ID of author of the story
	IF (NEW.user_id = story_writer_id) THEN
		RAISE 'Illegal contributor'
			USING ERRCODE = '52003';
	END IF;
	--
	-- Check if the contributor has blocked the author of the story
	IF (
		EXISTS (SELECT 1
				FROM
					blocks
				WHERE
					  blocker_id = NEW.user_id
				  AND blocked_id = story_writer_id
				  AND deleted_at IS NULL
			   )
		) THEN
		RAISE 'Contributor has blocked the author of the story'
			USING ERRCODE = '50004';
	END IF;
	--
	-- Check for `incoming_collaboration_requests` flag on the contributor
	SELECT incoming_collaboration_requests, is_private
	INTO contributor
	FROM
		users
	WHERE
		id = NEW.user_id;
	--
	IF (
		(
			contributor.is_private
				AND NOT EXISTS (SELECT 1
								FROM
									friends
								WHERE
									  (
										  (transmitter_id = NEW.user_id AND receiver_id = story_writer_id)
											  OR
										  (transmitter_id = story_writer_id AND receiver_id = NEW.user_id)
										  )
								  AND accepted_at IS NOT NULL
								  AND deleted_at IS NULL
							   )
			) OR (
			-- None
			contributor.incoming_collaboration_requests = 4 OR
				--
				-- Following
			(contributor.incoming_collaboration_requests = 2 AND
			 NOT EXISTS (SELECT 1
						 FROM
							 relations
						 WHERE
							   followed_id = story_writer_id
						   AND follower_id = NEW.user_id
						   AND deleted_at IS NULL
						)) OR
				--
				-- Friends
			(contributor.incoming_collaboration_requests = 3 AND
			 NOT EXISTS (SELECT 1
						 FROM
							 friends
						 WHERE
							   ((transmitter_id = NEW.user_id AND receiver_id = story_writer_id)
								   OR (transmitter_id = story_writer_id AND receiver_id = NEW.user_id))
						   AND accepted_at IS NOT NULL
						   AND deleted_at IS NULL
						))
			)) THEN
		RAISE 'Contributor is not accepting collaboration requests from the author of the story'
			USING ERRCODE = '51001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_contributor_insert_trigger
	BEFORE INSERT
	ON story_contributors
	FOR EACH ROW
EXECUTE PROCEDURE story_contributor_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION story_contributor_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Contributor soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Delete notifications
		DELETE
		FROM
			notifications
		WHERE
			entity_id = OLD.id;
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_contributor_update_trigger
	BEFORE UPDATE
	ON story_contributors
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE story_contributor_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION story_contributor_delete_trigger_proc(
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
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_contributor_delete_trigger
	AFTER DELETE
	ON story_contributors
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the contributor is directly deleted
EXECUTE PROCEDURE story_contributor_delete_trigger_proc();
