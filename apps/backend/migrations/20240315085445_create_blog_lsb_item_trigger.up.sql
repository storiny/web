CREATE OR REPLACE FUNCTION blog_lsb_item_insert_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the blog is soft-deleted
	IF (EXISTS(SELECT 1
			   FROM
				   blogs
			   WHERE
					 id = NEW.blog_id
				 AND deleted_at IS NOT NULL
			  )
		) THEN
		RAISE 'Blog is soft-deleted'
			USING ERRCODE = '52001';
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER blog_lsb_item_insert_trigger
	BEFORE INSERT
	ON blog_lsb_items
	FOR EACH ROW
EXECUTE PROCEDURE blog_lsb_item_insert_trigger_proc();
