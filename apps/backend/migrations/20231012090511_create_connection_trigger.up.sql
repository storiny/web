CREATE OR REPLACE FUNCTION connection_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the user is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id = NEW.user_id
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'User is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER connection_trigger
	BEFORE INSERT
	ON connections
	FOR EACH ROW
EXECUTE PROCEDURE connection_trigger_proc();

