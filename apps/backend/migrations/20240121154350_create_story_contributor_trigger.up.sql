CREATE OR REPLACE FUNCTION story_contributor_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
DECLARE
	incoming_collaboration_requests_value SMALLINT;
	story_writer_id                       BIGINT;
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
	-- Check if the contributor is blocked by the author of the story
	IF (
		EXISTS (SELECT 1
				FROM
					blocks
				WHERE
					  blocker_id = story_writer_id
				  AND blocked_id = NEW.user_id
				  AND deleted_at IS NULL
			   )
		) THEN
		RAISE 'Contributor is blocked by the author of the story'
			USING ERRCODE = '50004';
	END IF;
	--
	-- Check for `incoming_collaboration_requests` flag on the contributor
	SELECT incoming_collaboration_requests
	INTO incoming_collaboration_requests_value
	FROM
		users
	WHERE
		id = NEW.user_id;
	--
	IF (
		-- None
		incoming_collaboration_requests_value = 4 OR
			--
			-- Following
		(incoming_collaboration_requests_value = 2 AND
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
		(incoming_collaboration_requests_value = 3 AND
		 NOT EXISTS (SELECT 1
					 FROM
						 friends
					 WHERE
						   ((transmitter_id = NEW.user_id AND receiver_id = story_writer_id)
							   OR (transmitter_id = story_writer_id AND receiver_id = NEW.user_id))
					   AND accepted_at IS NOT NULL
					   AND deleted_at IS NULL
					))
		) THEN
		RAISE 'Contributor is not accepting collaboration requests from the author of the story'
			USING ERRCODE = '51001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_contributor_trigger
	BEFORE INSERT
	ON story_contributors
	FOR EACH ROW
EXECUTE PROCEDURE story_contributor_trigger_proc();

