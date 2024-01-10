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
	-- Story recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Reset `is_deleted_by_user` flag
		NEW.is_deleted_by_user := NULL;
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
