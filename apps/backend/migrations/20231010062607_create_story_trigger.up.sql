-- Converts `draft_tags` to `story_tags` for a story.
CREATE OR REPLACE FUNCTION convert_draft_tags_to_story_tags(
	story_id_arg BIGINT
) RETURNS VOID AS
$$
DECLARE
	dt_row RECORD;
BEGIN
	FOR dt_row IN
		SELECT name
		FROM
			draft_tags
		WHERE
			story_id = story_id_arg
		-- Maximum 5 tags (sanity)
		LIMIT 5
		LOOP
			WITH found_tag    AS (SELECT id
								  FROM
									  tags
								  WHERE
									  name = dt_row.name
								 ),
				 -- Insert tag if not exist
				 inserted_tag AS (
					 INSERT INTO tags (name)
						 SELECT dt_row.name
						 WHERE
							 NOT EXISTS (SELECT 1
										 FROM
											 found_tag
										)
						 RETURNING id
								 )
			INSERT
			INTO
				story_tags (story_id, tag_id)
			SELECT story_id_arg,
				   COALESCE((SELECT id FROM found_tag), (SELECT id FROM inserted_tag));
		END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert
--
CREATE OR REPLACE FUNCTION story_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the story writer is soft-deleted or deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id = NEW.user_id
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'Story writer is either soft-deleted or deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_before_insert_trigger
	BEFORE INSERT
	ON stories
	FOR EACH ROW
EXECUTE PROCEDURE story_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION story_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Insert a document
	INSERT INTO documents (story_id)
	VALUES (NEW.id);
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_after_insert_trigger
	AFTER INSERT
	ON stories
	FOR EACH ROW
EXECUTE PROCEDURE story_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION story_before_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Story soft-deleted or unpublished
	IF ((OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR
		(OLD.published_at IS NOT NULL AND NEW.published_at IS NULL)) THEN
		-- Reset `view_count` and `read_count` as a penalty
		NEW.view_count := 0;
		NEW.read_count := 0;
		NEW.edited_at := NULL;
		-- Also delete all the read analytics data
		DELETE
		FROM
			story_reads
		WHERE
			story_id = NEW.id;
		--
		-- Decrement `story_count` on user if the story was previously published
		IF (OLD.published_at IS NOT NULL) THEN
			UPDATE
				users
			SET
				story_count = story_count - 1
			WHERE
				  id = NEW.user_id
			  AND story_count > 0;
		END IF;
		--
		RETURN NEW;
		--
	END IF;
	--
	-- Story (that was already published) recovered or a draft is published
	IF ((OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL AND OLD.published_at IS NOT NULL) OR
		(OLD.published_at IS NULL AND NEW.published_at IS NOT NULL)) THEN
		--
		IF (OLD.published_at IS NULL AND NEW.published_at IS NOT NULL) THEN
			-- Update `first_published_at` on publishing the story
			NEW.first_published_at := NEW.published_at;
		END IF;
		--
		-- Increment `story_count` on user
		UPDATE
			users
		SET
			story_count = story_count + 1
		WHERE
			id = NEW.user_id;
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_before_update_trigger
	BEFORE UPDATE
	ON stories
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR OLD.published_at IS DISTINCT FROM NEW.published_at)
EXECUTE PROCEDURE story_before_update_trigger_proc();

--
CREATE OR REPLACE FUNCTION story_after_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Story soft-deleted or unpublished
	IF ((OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR
		(OLD.published_at IS NOT NULL AND NEW.published_at IS NULL)) THEN
		-- Drop the editable document
		UPDATE documents
		SET
			story_id = NULL
		WHERE
			  story_id = NEW.id
		  AND is_editable IS TRUE;
		--
		-- Drop relations for published (now soft-deleted or unpublished) story
		IF (OLD.published_at IS NOT NULL) THEN
			-- Soft-delete comments
			UPDATE
				comments
			SET
				deleted_at = NOW()
			WHERE
				  deleted_at IS NULL
			  AND story_id = NEW.id;
			--
			-- Soft-delete story likes
			UPDATE
				story_likes
			SET
				deleted_at = NOW()
			WHERE
				  deleted_at IS NULL
			  AND story_id = NEW.id;
			--
			-- Soft-delete bookmarks
			UPDATE
				bookmarks
			SET
				deleted_at = NOW()
			WHERE
				  deleted_at IS NULL
			  AND story_id = NEW.id;
			--
			-- Soft-delete histories
			UPDATE
				histories
			SET
				deleted_at = NOW()
			WHERE
				  deleted_at IS NULL
			  AND story_id = NEW.id;
			--
			-- Convert `story_tags` to `draft_tags`
			INSERT INTO draft_tags (name, story_id)
			SELECT t.name,
				   NEW.id
			FROM
				story_tags st
					INNER JOIN tags t
							   ON st.tag_id = t.id
			WHERE
				st.story_id = NEW.id
			-- Maximum 5 tags (sanity)
			LIMIT 5;
			--
			-- Delete story tags
			DELETE
			FROM
				story_tags
			WHERE
				story_id = NEW.id;
			--
		END IF;
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
	-- Story (published) recovered or published
	IF ((NEW.published_at IS NOT NULL AND OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) OR
		(OLD.published_at IS NULL AND NEW.published_at IS NOT NULL)) THEN
		-- Restore comments
		UPDATE
			comments AS c
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND c.story_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = c.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		--
		-- Restore story likes
		UPDATE
			story_likes AS sl
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND sl.story_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = sl.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		--
		-- Restore bookmarks
		UPDATE
			bookmarks AS b
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND b.story_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = b.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		--
		-- Restore histories
		UPDATE
			histories AS h
		SET
			deleted_at = NULL
		WHERE
			  deleted_at IS NOT NULL
		  AND h.story_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = h.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		--
		-- Convert `draft_tags` to `story_tags`
		PERFORM convert_draft_tags_to_story_tags(NEW.id);
		--
		-- Delete draft tags
		DELETE
		FROM
			draft_tags
		WHERE
			story_id = NEW.id;
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_after_update_trigger
	AFTER UPDATE
	ON stories
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR OLD.published_at IS DISTINCT FROM NEW.published_at)
EXECUTE PROCEDURE story_after_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION story_delete_trigger_proc(
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
	-- Decrement `story_count` on user if the story was previously published
	IF (OLD.published_at IS NOT NULL) THEN
		UPDATE
			users
		SET
			story_count = story_count - 1
		WHERE
			  id = OLD.user_id
		  AND story_count > 0;
	END IF;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_delete_trigger
	AFTER DELETE
	ON stories
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the story is directly deleted
EXECUTE PROCEDURE story_delete_trigger_proc();

