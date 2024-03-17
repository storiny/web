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
		IF (NEW.deleted_at IS NOT NULL) THEN
			-- Drop contributors when the story is soft-deleted
			UPDATE story_contributors
			SET
				deleted_at = NOW()
			WHERE
				  deleted_at IS NULL
			  AND story_id = NEW.id;
			--
			-- Drop blog relations when the story is soft-deleted
			UPDATE blog_stories
			SET
				deleted_at = NOW()
			WHERE
				  deleted_at IS NULL
			  AND story_id = NEW.id;
		END IF;
		--
		-- Drop relations for published (now soft-deleted or unpublished) story
		IF (OLD.published_at IS NOT NULL) THEN
			IF (NEW.published_at IS NULL) THEN
				-- Unaccept the blog requests when the story is unpublished
				UPDATE blog_stories
				SET
					accepted_at = NULL
				WHERE
					  accepted_at IS NOT NULL
				  AND story_id = NEW.id;
			END IF;
			--
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
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Restore story contributors when the story is recovered
		UPDATE story_contributors AS sc
		SET
			deleted_at = NULL
		WHERE
			  sc.deleted_at IS NOT NULL
		  AND sc.story_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = sc.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		-- Restore blog relations when the story is recovered
		UPDATE blog_stories AS bs
		SET
			deleted_at = NULL
		WHERE
			  bs.deleted_at IS NOT NULL
		  AND bs.story_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 blogs AS b
					 WHERE
						   b.id = bs.blog_id
					   AND b.deleted_at IS NULL
					);
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
			  c.deleted_at IS NOT NULL
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
			  sl.deleted_at IS NOT NULL
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
			  b.deleted_at IS NOT NULL
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
			  h.deleted_at IS NOT NULL
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
