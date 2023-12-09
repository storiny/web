-- Insert
--
CREATE OR REPLACE FUNCTION story_read_before_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the story is soft-deleted/unpublished
	IF (EXISTS(SELECT 1
			   FROM
				   stories
			   WHERE
					 id = NEW.story_id
				 AND (deleted_at IS NOT NULL
				   OR published_at IS NULL)
			  )
		) THEN
		RAISE 'Story is soft-deleted/unpublished'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_read_before_insert_trigger
	BEFORE INSERT
	ON story_reads
	FOR EACH ROW
EXECUTE PROCEDURE story_read_before_insert_trigger_proc();

--
CREATE OR REPLACE FUNCTION story_read_after_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Increment `read_count` on story
	UPDATE
		stories
	SET
		read_count = read_count + 1
	WHERE
		id = NEW.story_id;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_read_after_insert_trigger
	AFTER INSERT
	ON story_reads
	FOR EACH ROW
EXECUTE PROCEDURE story_read_after_insert_trigger_proc();
