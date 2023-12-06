CREATE OR REPLACE FUNCTION tag_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Delete tag when there are no stories
	DELETE
	FROM
		tags
	WHERE
		id = NEW.id;
	RETURN NULL;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tag_trigger
	BEFORE UPDATE
	ON tags
	FOR EACH ROW
	WHEN (NEW.story_count = 0)
EXECUTE PROCEDURE tag_trigger_proc();

