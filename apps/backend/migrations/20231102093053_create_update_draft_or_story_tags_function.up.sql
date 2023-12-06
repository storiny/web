-- Updates tags for a draft or a story.
CREATE OR REPLACE FUNCTION "public"."update_draft_or_story_tags"(
	story_id_arg   BIGINT,
	user_id_arg    BIGINT,
	next_tag_names TEXT[]
) RETURNS VOID AS
$$
DECLARE
	story RECORD;
BEGIN
	SELECT INTO story s.published_at
	FROM
		stories s
	WHERE
		  s.id = story_id_arg
	  AND s.user_id = user_id_arg
	  AND s.deleted_at IS NULL;
	IF NOT FOUND THEN
		RAISE 'Story not found'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Draft
	IF story.published_at IS NULL THEN
		-- Delete old draft_tags
		DELETE
		FROM
			draft_tags
		WHERE
			story_id = story_id_arg;
		-- Insert new draft_tags
		INSERT
			INTO
			draft_tags (name, story_id)
		SELECT UNNEST(next_tag_names),
			   story_id_arg;
	ELSE
		-- Published story
		-- Delete removed tags
		DELETE
		FROM
			story_tags st
			USING tags t
		WHERE
			  st.story_id = story_id_arg
		  AND st.tag_id = t.id
		  AND t.name != ALL (next_tag_names);
		-- Insert new tags
		INSERT
			INTO
			tags (name)
		SELECT UNNEST(next_tag_names)
		ON CONFLICT (name) DO NOTHING;
		-- Insert new story_tags
		INSERT INTO story_tags (story_id, tag_id)
		SELECT story_id_arg,
			   t.id
		FROM
			tags t
		WHERE
			t.name = ANY (next_tag_names)
		ON CONFLICT (story_id, tag_id) DO NOTHING;
	END IF;
END;
$$ LANGUAGE plpgsql;