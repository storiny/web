-- Insert
--
CREATE OR REPLACE FUNCTION blog_writer_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
DECLARE
	writer                RECORD;
	blog_user_id          BIGINT;
	writer_limit CONSTANT SMALLINT := 10;
BEGIN
	-- Check whether the blog is soft-deleted or the user is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   blogs
			   WHERE
					 id = NEW.blog_id
				 AND deleted_at IS NOT NULL
			  ) OR EXISTS(SELECT 1
						  FROM
							  users
						  WHERE
								id = NEW.receiver_id
							AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
						 )) THEN
		RAISE 'Blog is soft-deleted or user is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check whether the writer limit has been reached for the blog
	IF (EXISTS(SELECT
			   FROM
				   blogs
			   WHERE
					 id = NEW.blog_id
				 AND has_plus_features IS FALSE
			  ) AND
		(SELECT COUNT(*)
		 FROM
			 blog_writers
		 WHERE
			 blog_id = NEW.blog_id
		) >= writer_limit
		) THEN
		RAISE 'Maximum number of writers reached for the blog'
			USING ERRCODE = '52006';
	END IF;
	--
	SELECT user_id
	INTO blog_user_id
	FROM
		blogs
	WHERE
		id = NEW.blog_id;
	--
	-- Check whether the writer's ID is same as the ID of owner of the blog,
	-- the transmitter of the request, or any of the editors of the blog.
	IF (
		NEW.receiver_id = blog_user_id
			OR NEW.receiver_id = NEW.transmitter_id
			OR EXISTS(SELECT
					  FROM
						  blog_editors AS be
					  WHERE
							be.user_id = NEW.receiver_id
						AND be.blog_id = NEW.blog_id
					 )
		) THEN
		RAISE 'Illegal writer'
			USING ERRCODE = '52008';
	END IF;
	--
	-- Check if the writer has blocked the transmitter of the request
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
		RAISE 'Writer has blocked the transmitter of the request'
			USING ERRCODE = '50006';
	END IF;
	--
	-- Check for `incoming_blog_requests` flag on the writer
	SELECT incoming_blog_requests, is_private
	INTO writer
	FROM
		users
	WHERE
		id = NEW.receiver_id;
	--
	IF (
		(
			writer.is_private
				AND NOT EXISTS (SELECT 1
								FROM
									friends
								WHERE
									  (
										  (transmitter_id = NEW.receiver_id AND receiver_id = NEW.transmitter_id)
											  OR
										  (transmitter_id = NEW.transmitter_id AND receiver_id = NEW.receiver_id)
										  )
								  AND accepted_at IS NOT NULL
								  AND deleted_at IS NULL
							   )
			) OR (
			-- None
			writer.incoming_blog_requests = 4 OR
				--
				-- Following
			(writer.incoming_blog_requests = 2 AND
			 NOT EXISTS (SELECT 1
						 FROM
							 relations
						 WHERE
							   followed_id = NEW.transmitter_id
						   AND follower_id = NEW.receiver_id
						   AND deleted_at IS NULL
						)) OR
				--
				-- Friends
			(writer.incoming_blog_requests = 3 AND
			 NOT EXISTS (SELECT 1
						 FROM
							 friends
						 WHERE
							   ((transmitter_id = NEW.receiver_id AND receiver_id = NEW.transmitter_id)
								   OR (transmitter_id = NEW.transmitter_id AND receiver_id = NEW.receiver_id))
						   AND accepted_at IS NOT NULL
						   AND deleted_at IS NULL
						))
			)) THEN
		RAISE 'Writer is not accepting blog requests from the transmitter of the request'
			USING ERRCODE = '51003';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_writer_insert_trigger
	BEFORE INSERT
	ON blog_writers
	FOR EACH ROW
EXECUTE PROCEDURE blog_writer_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION blog_writer_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Blog writer request accepted
	IF (OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL) THEN
		-- Increment `writer_count`
		UPDATE
			blogs
		SET
			writer_count = writer_count + 1
		WHERE
			id = NEW.blog_id;
		--
		RETURN NEW;
	END IF;
	--
	-- Only update the counter cache for accepted writers
	IF (NEW.accepted_at IS NOT NULL) THEN
		-- Blog writer soft-deleted
		IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
			-- Decrement `writer_count`
			UPDATE
				blogs
			SET
				writer_count = writer_count - 1
			WHERE
				  id = NEW.blog_id
			  AND writer_count > 0;
			--
			-- Delete notifications
			DELETE
			FROM
				notifications
			WHERE
				entity_id = NEW.id;
			--
			RETURN NEW;
		END IF;
		--
		-- Blog writer recovered
		IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
			-- Increment `writer_count`
			UPDATE
				blogs
			SET
				writer_count = writer_count + 1
			WHERE
				id = NEW.blog_id;
			--
		END IF;
	END IF;
	--
	-- Blog writer soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Delete notifications
		DELETE
		FROM
			notifications
		WHERE
			entity_id = NEW.id;
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_writer_update_trigger
	BEFORE UPDATE
	ON blog_writers
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR OLD.accepted_at IS DISTINCT FROM NEW.accepted_at)
EXECUTE PROCEDURE blog_writer_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION blog_writer_delete_trigger_proc(
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
	IF (OLD.accepted_at IS NOT NULL) THEN
		-- Decrement `writer_count`
		UPDATE
			blogs
		SET
			writer_count = writer_count - 1
		WHERE
			  id = OLD.blog_id
		  AND writer_count > 0;
	END IF;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_writer_delete_trigger
	AFTER DELETE
	ON blog_writers
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the writer is directly deleted
EXECUTE PROCEDURE blog_writer_delete_trigger_proc();
