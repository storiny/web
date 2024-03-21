-- Insert
--
CREATE OR REPLACE FUNCTION blog_story_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
DECLARE
	blog_user_id  BIGINT;
	story_user_id BIGINT;
BEGIN
	-- Check whether the blog is soft-deleted or the story is soft-deleted
	IF (
		EXISTS(SELECT 1
			   FROM
				   blogs
			   WHERE
					 id = NEW.blog_id
				 AND deleted_at IS NOT NULL
			  ) OR
		EXISTS(SELECT 1
			   FROM
				   stories
			   WHERE
					 id = NEW.story_id
				 AND deleted_at IS NOT NULL
			  )
		) THEN
		RAISE 'Blog is soft-deleted or story is soft-deleted'
			USING ERRCODE = '52001';
	END IF;
	--
	SELECT user_id
	INTO blog_user_id
	FROM
		blogs
	WHERE
		id = NEW.blog_id;
	--
	SELECT user_id
	INTO story_user_id
	FROM
		stories
	WHERE
		id = NEW.story_id;
	--
	-- Check whether the author of the story is allowed to submit it for review
	IF (
		story_user_id <> blog_user_id
			AND NOT EXISTS (SELECT
							FROM
								blog_editors AS be
							WHERE
								  be.user_id = story_user_id
							  AND be.blog_id = NEW.blog_id
							  AND be.accepted_at IS NOT NULL
							  AND be.deleted_at IS NULL
						   )
			AND NOT EXISTS (SELECT
							FROM
								blog_writers AS bw
							WHERE
								  bw.receiver_id = story_user_id
							  AND bw.blog_id = NEW.blog_id
							  AND bw.accepted_at IS NOT NULL
							  AND bw.deleted_at IS NULL
						   )
		) THEN
		RAISE 'Illegal blog story'
			USING ERRCODE = '52009';
	END IF;
	--
	-- Check whether the blog is locked
	IF (EXISTS (SELECT
				FROM
					blogs
				WHERE
					  id = NEW.blog_id
				  AND is_active IS FALSE
			   )
		) THEN
		RAISE 'Blog is locked'
			USING ERRCODE = '52010';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_story_insert_trigger
	BEFORE INSERT
	ON blog_stories
	FOR EACH ROW
EXECUTE PROCEDURE blog_story_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION blog_story_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check if the blog is locked when the story is accepted
	IF (
		OLD.accepted_at IS NULL
			AND NEW.accepted_at IS NOT NULL
			AND EXISTS(SELECT
					   FROM
						   blogs
					   WHERE
							 id = NEW.blog_id
						 AND is_active IS FALSE
					  )) THEN
		RAISE 'Blog is locked'
			USING ERRCODE = '52010';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_story_update_trigger
	BEFORE UPDATE
	ON blog_stories
	FOR EACH ROW
	WHEN (OLD.accepted_at IS DISTINCT FROM NEW.accepted_at)
EXECUTE PROCEDURE blog_story_update_trigger_proc();
