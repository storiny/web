CREATE OR REPLACE FUNCTION mute_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Sanity check
	IF (NEW.muter_id = NEW.muted_id) THEN
		RAISE 'Source user is equivalent to the target user'
			USING ERRCODE = '52000';
	END IF;
	--
	-- Check whether the muter/muted user is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id IN (NEW.muter_id, NEW.muted_id)
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'Muter/muted user is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER mute_trigger
	BEFORE INSERT
	ON mutes
	FOR EACH ROW
EXECUTE PROCEDURE mute_trigger_proc();

