CREATE OR REPLACE FUNCTION document_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the story is soft-deleted
	IF (EXISTS(SELECT
				   1
			   FROM
				   stories
			   WHERE
					 id = NEW.story_id
				 AND deleted_at IS NOT NULL
			  )) THEN
		RAISE 'Story is soft-deleted'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER document_trigger
	BEFORE INSERT
	ON documents
	FOR EACH ROW
EXECUTE PROCEDURE document_trigger_proc();

