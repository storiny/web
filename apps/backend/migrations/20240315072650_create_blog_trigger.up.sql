-- Insert
--
CREATE OR REPLACE FUNCTION blog_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the blog owner is soft-deleted or deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id = NEW.user_id
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'Blog owner is either soft-deleted or deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_before_insert_trigger
	BEFORE INSERT
	ON blogs
	FOR EACH ROW
EXECUTE PROCEDURE blog_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION blog_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Insert a row into `blog_lsb_items` for home item
	INSERT INTO blog_lsb_items(name, target, priority, blog_id)
	VALUES ('Home', '/', 1, NEW.id);
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_after_insert_trigger
	AFTER INSERT
	ON blogs
	FOR EACH ROW
EXECUTE PROCEDURE blog_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION blog_before_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Soft-delete the blog if `user_id` is NULL
	IF (NEW.user_id IS NULL AND NEW.deleted_at IS NULL) THEN
		NEW.deleted_at := NOW();
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_before_update_trigger
	BEFORE UPDATE
	ON blogs
	FOR EACH ROW
	WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
EXECUTE PROCEDURE blog_before_update_trigger_proc();

--
CREATE OR REPLACE FUNCTION blog_after_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Blog soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Soft-delete blog stories
		UPDATE
			blog_stories
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND blog_id = NEW.id;
		--
		-- Soft-delete blog editors
		UPDATE
			blog_editors
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND blog_id = NEW.id;
		--
		-- Soft-delete blog writers
		UPDATE
			blog_writers
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND blog_id = NEW.id;
		--
		-- Soft-delete blog followers
		UPDATE
			blog_followers
		SET
			deleted_at = NOW()
		WHERE
			  deleted_at IS NULL
		  AND blog_id = NEW.id;
		--
	END IF;
	--
	-- Blog recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Restore blog stories
		UPDATE
			blog_stories AS bs
		SET
			deleted_at = NULL
		WHERE
			  bs.deleted_at IS NOT NULL
		  AND bs.blog_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 stories AS s
					 WHERE
						   s.id = bs.story_id
					   AND s.deleted_at IS NULL
					);
		--
		-- Restore blog editors
		UPDATE
			blog_editors AS be
		SET
			deleted_at = NULL
		WHERE
			  be.deleted_at IS NOT NULL
		  AND be.blog_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = be.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		--
		-- Restore blog writers
		UPDATE
			blog_writers AS bw
		SET
			deleted_at = NULL
		WHERE
			  bw.deleted_at IS NOT NULL
		  AND bw.blog_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = bw.receiver_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		--
		-- Restore blog followers
		UPDATE
			blog_followers AS bf
		SET
			deleted_at = NULL
		WHERE
			  bf.deleted_at IS NOT NULL
		  AND bf.blog_id = NEW.id
		  AND EXISTS(SELECT 1
					 FROM
						 users AS u
					 WHERE
						   u.id = bf.user_id
					   AND u.deleted_at IS NULL
					   AND u.deactivated_at IS NULL
					);
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_after_update_trigger
	AFTER UPDATE
	ON blogs
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE blog_after_update_trigger_proc();
