CREATE OR REPLACE FUNCTION history_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the story is soft-deleted/unpublished or the user is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   stories
			   WHERE
					 id = NEW.story_id
				 AND (deleted_at IS NOT NULL
				   OR published_at IS NULL)
			  ) OR EXISTS(SELECT 1
						  FROM
							  users
						  WHERE
								id = NEW.user_id
							AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
						 )) THEN
		RAISE 'Story is soft-deleted/unpublished or user is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check whether the user has disabled read history
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id = NEW.user_id
				 AND disable_read_history IS TRUE
			  )) THEN
		-- Skip inserting the row
		RETURN NULL;
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER history_trigger
	BEFORE INSERT
	ON histories
	FOR EACH ROW
EXECUTE PROCEDURE history_trigger_proc();

