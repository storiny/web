-- Insert
--
CREATE OR REPLACE FUNCTION reply_like_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the reply is soft-deleted or the user is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   replies
			   WHERE
					 id = NEW.reply_id
				 AND deleted_at IS NOT NULL
			  ) OR EXISTS(SELECT 1
						  FROM
							  users
						  WHERE
								id = NEW.user_id
							AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
						 )) THEN
		RAISE 'Reply is soft-deleted or user is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_like_before_insert_trigger
	BEFORE INSERT
	ON reply_likes
	FOR EACH ROW
EXECUTE PROCEDURE reply_like_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION reply_like_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Increment `like_count` on reply
	UPDATE
		replies
	SET
		like_count = like_count + 1
	WHERE
		id = NEW.reply_id;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_like_after_insert_trigger
	AFTER INSERT
	ON reply_likes
	FOR EACH ROW
EXECUTE PROCEDURE reply_like_after_insert_trigger_proc();

-- Update
--
CREATE OR REPLACE FUNCTION reply_like_before_update_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Reply like soft-deleted
	IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
		-- Decrement `like_count` on reply
		UPDATE
			replies
		SET
			like_count = like_count - 1
		WHERE
			  id = NEW.reply_id
		  AND like_count > 0;
		--
		RETURN NEW;
		--
	END IF;
	--
	-- Reply like recovered
	IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
		-- Increment `like_count` on reply
		UPDATE
			replies
		SET
			like_count = like_count + 1
		WHERE
			id = NEW.reply_id;
		--
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_like_before_update_trigger
	BEFORE UPDATE
	ON reply_likes
	FOR EACH ROW
	WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE PROCEDURE reply_like_before_update_trigger_proc();

-- Delete
--
CREATE OR REPLACE FUNCTION reply_like_delete_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Decrement `like_count` on reply
	UPDATE
		replies
	SET
		like_count = like_count - 1
	WHERE
		  id = OLD.reply_id
	  AND like_count > 0;
	--
	RETURN OLD;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reply_like_delete_trigger
	AFTER DELETE
	ON reply_likes
	FOR EACH ROW
	WHEN (OLD.deleted_at IS NULL) -- Only run when the reply like is directly deleted
EXECUTE PROCEDURE reply_like_delete_trigger_proc();

