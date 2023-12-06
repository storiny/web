CREATE OR REPLACE FUNCTION notification_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the notifier is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id = NEW.notifier_id
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'Notifier is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER notification_trigger
	BEFORE INSERT
	ON notifications
	FOR EACH ROW
EXECUTE PROCEDURE notification_trigger_proc();

