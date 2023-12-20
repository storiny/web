-- Inserts notifications for tag followers when a new story is published.
CREATE OR REPLACE FUNCTION "public"."notify_tag_followers"(
	story_id_arg    BIGINT,
	entity_type_arg SMALLINT
) RETURNS VOID AS
$$
DECLARE
	st_row RECORD;
BEGIN
	FOR st_row IN
		SELECT id
		FROM
			story_tags
		WHERE
			story_id = story_id_arg
		-- Maximum 5 tags (sanity)
		LIMIT 5
		LOOP
			WITH story_tag_relation    AS (SELECT st.story_id,
												  st.tag_id
										   FROM
											   story_tags st
										   WHERE
											   st.id = st_row.id
										  ),
				 published_story       AS (SELECT user_id
										   FROM
											   stories
										   WHERE
											   id = (SELECT story_id FROM story_tag_relation)
										  ),
				 inserted_notification AS (
					 INSERT INTO notifications (entity_type, entity_id, notifier_id)
						 SELECT entity_type_arg,
								st_row.id,
								(SELECT user_id FROM published_story)
						 WHERE
							 EXISTS (SELECT 1 FROM published_story)
						 RETURNING id
										  )
			INSERT
			INTO
				notification_outs (notified_id, notification_id)
			SELECT target_id,
				   (SELECT id FROM inserted_notification)
			FROM
				(SELECT tf.user_id AS "target_id"
				 FROM
					 tag_followers tf
				 WHERE
					   tf.tag_id = (SELECT tf.tag_id FROM story_tag_relation)
					   -- Do not notify the publisher of the story (if they follow the tag).
				   AND tf.user_id <> (SELECT user_id FROM published_story)
				   AND tf.deleted_at IS NULL
				) AS followers
			WHERE
				EXISTS (SELECT 1 FROM published_story);
		END LOOP;
END;
$$ LANGUAGE plpgsql;