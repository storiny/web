-- Insert
--
CREATE OR REPLACE FUNCTION blog_follower_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
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
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_follower_before_insert_trigger
	BEFORE INSERT
	ON blog_followers
	FOR EACH ROW
EXECUTE PROCEDURE blog_follower_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION blog_follower_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Increment `follower_count` on blog
	UPDATE
		blogs
	SET
		follower_count = follower_count + 1
	WHERE
		id = NEW.blog_id;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_follower_after_insert_trigger
	AFTER INSERT
	ON blog_followers
	FOR EACH ROW
EXECUTE PROCEDURE blog_follower_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION blog_follower_before_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Blog follower soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Decrement `follower_count` on blog
		UPDATE
			blogs
		SET
			follower_count = follower_count - 1
		WHERE
			  id = NEW.blog_id
		  AND follower_count > 0;
		--
		RETURN NEW;
		--
	END IF;
	--
	-- Blog follower recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Increment `follower_count` on blog
		UPDATE
			blogs
		SET
			follower_count = follower_count + 1
		WHERE
			id = NEW.blog_id;
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_follower_before_update_trigger
	BEFORE UPDATE
	ON blog_followers
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE blog_follower_before_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION blog_follower_delete_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Decrement `follower_count` on blog
	UPDATE
		blogs
	SET
		follower_count = follower_count - 1
	WHERE
		  id = OLD.blog_id
	  AND follower_count > 0;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_follower_delete_trigger
	AFTER DELETE
	ON blog_followers
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the blog follower is directly deleted
EXECUTE PROCEDURE blog_follower_delete_trigger_proc();
