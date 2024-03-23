-- Insert
--
CREATE OR REPLACE FUNCTION blog_editor_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
DECLARE
	editor                RECORD;
	blog_user_id          BIGINT;
	editor_limit CONSTANT SMALLINT := 5;
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
								id = NEW.user_id
							AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
						 )) THEN
		RAISE 'Blog is soft-deleted or user is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check whether the editor limit has been reached for the blog
	IF (EXISTS(SELECT
			   FROM
				   blogs
			   WHERE
					 id = NEW.blog_id
				 AND has_plus_features IS FALSE
			  ) AND
		(SELECT COUNT(*)
		 FROM
			 blog_editors
		 WHERE
			 blog_id = NEW.blog_id
		) >= editor_limit
		) THEN
		RAISE 'Maximum number of editors reached for the blog'
			USING ERRCODE = '52005';
	END IF;
	--
	SELECT user_id
	INTO blog_user_id
	FROM
		blogs
	WHERE
		id = NEW.blog_id;
	--
	-- Check whether the editor's ID is same as the ID of owner of the blog
	IF (NEW.user_id = blog_user_id) THEN
		RAISE 'Illegal editor'
			USING ERRCODE = '52007';
	END IF;
	--
	-- Check if the editor has blocked the owner of the blog
	IF (
		EXISTS (SELECT 1
				FROM
					blocks
				WHERE
					  blocker_id = NEW.user_id
				  AND blocked_id = blog_user_id
				  AND deleted_at IS NULL
			   )
		) THEN
		RAISE 'Editor has blocked the owner of the blog'
			USING ERRCODE = '50005';
	END IF;
	--
	-- Check for `incoming_blog_requests` flag on the editor
	SELECT incoming_blog_requests, is_private
	INTO editor
	FROM
		users
	WHERE
		id = NEW.user_id;
	--
	IF (
		(
			editor.is_private
				AND NOT EXISTS (SELECT 1
								FROM
									friends
								WHERE
									  (
										  (transmitter_id = NEW.user_id AND receiver_id = blog_user_id)
											  OR
										  (transmitter_id = blog_user_id AND receiver_id = NEW.user_id)
										  )
								  AND accepted_at IS NOT NULL
								  AND deleted_at IS NULL
							   )
			) OR (
			-- None
			editor.incoming_blog_requests = 4 OR
				--
				-- Following
			(editor.incoming_blog_requests = 2 AND
			 NOT EXISTS (SELECT 1
						 FROM
							 relations
						 WHERE
							   followed_id = blog_user_id
						   AND follower_id = NEW.user_id
						   AND deleted_at IS NULL
						)) OR
				--
				-- Friends
			(editor.incoming_blog_requests = 3 AND
			 NOT EXISTS (SELECT 1
						 FROM
							 friends
						 WHERE
							   ((transmitter_id = NEW.user_id AND receiver_id = blog_user_id)
								   OR (transmitter_id = blog_user_id AND receiver_id = NEW.user_id))
						   AND accepted_at IS NOT NULL
						   AND deleted_at IS NULL
						))
			)) THEN
		RAISE 'Editor is not accepting blog requests from the owner of the blog'
			USING ERRCODE = '51002';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_editor_insert_trigger
	BEFORE INSERT
	ON blog_editors
	FOR EACH ROW
EXECUTE PROCEDURE blog_editor_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION blog_editor_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Blog editor request accepted
	IF (OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL) THEN
		-- Delete redundant writer
		DELETE
		FROM
			blog_writers AS bw
		WHERE
			  bw.receiver_id = NEW.user_id
		  AND bw.blog_id = NEW.blog_id;
		--
		-- Increment `editor_count`
		UPDATE
			blogs
		SET
			editor_count = editor_count + 1
		WHERE
			id = NEW.blog_id;
		--
		RETURN NEW;
	END IF;
	--
	-- Only update the counter cache for accepted editors
	IF (NEW.accepted_at IS NOT NULL) THEN
		-- Blog editor soft-deleted
		IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
			-- Decrement `editor_count`
			UPDATE
				blogs
			SET
				editor_count = editor_count - 1
			WHERE
				  id = NEW.blog_id
			  AND editor_count > 0;
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
		-- Blog editor recovered
		IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
			-- Increment `editor_count`
			UPDATE
				blogs
			SET
				editor_count = editor_count + 1
			WHERE
				id = NEW.blog_id;
			--
		END IF;
	END IF;
	--
	-- Blog editor soft-deleted
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

CREATE OR REPLACE TRIGGER blog_editor_update_trigger
	BEFORE UPDATE
	ON blog_editors
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR OLD.accepted_at IS DISTINCT FROM NEW.accepted_at)
EXECUTE PROCEDURE blog_editor_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION blog_editor_delete_trigger_proc(
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
		-- Decrement `editor_count`
		UPDATE
			blogs
		SET
			editor_count = editor_count - 1
		WHERE
			  id = OLD.blog_id
		  AND editor_count > 0;
	END IF;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_editor_delete_trigger
	AFTER DELETE
	ON blog_editors
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the editor is directly deleted
EXECUTE PROCEDURE blog_editor_delete_trigger_proc();
