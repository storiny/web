CREATE OR REPLACE FUNCTION draft_tag_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the story is non-deleted/published
	IF (NOT EXISTS(SELECT 1
				   FROM
					   stories
				   WHERE
						 id = NEW.story_id
					 AND ( -- Draft
							 (published_at IS NULL AND first_published_at IS NULL AND deleted_at IS NULL)
								 -- Soft-delete (`published_at` depends on the source of the
								 -- action: cascade (column not changed) or user (column is set to NULL))
								 OR (first_published_at IS NOT NULL AND deleted_at IS NOT NULL)
								 -- Unpublish
								 OR (published_at IS NULL AND first_published_at IS NOT NULL AND deleted_at IS NULL))
				  )) THEN
		RAISE 'Story is non-deleted/published'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER draft_tag_trigger
	BEFORE INSERT
	ON draft_tags
	FOR EACH ROW
EXECUTE PROCEDURE draft_tag_trigger_proc();
