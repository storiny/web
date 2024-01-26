-- Generates HTML content string for a notification based on the notification's `entity_type`
CREATE OR REPLACE FUNCTION "public"."render_notification_content"(
	entity_type SMALLINT,
	nu          notification_outs
) RETURNS TEXT AS
$$
BEGIN
	RETURN
		(
			CASE
				-- Login attempt
				WHEN
					entity_type = 2
					THEN (WITH notification_out AS (SELECT n_out.rendered_content
													FROM
														notification_outs n_out
													WHERE
														  n_out.notification_id = nu.notification_id
													  AND n_out.notified_id = nu.notified_id
												   )
						  SELECT (
									 FORMAT(
											 'There was a successful login attempt to your account using'
												 || ' <b>%s</b>'
												 || CASE
												 -- Insert client location if exist
														WHEN CHAR_LENGTH(
																	 SPLIT_PART((SELECT rendered_content FROM notification_out), ':', 2)
															 ) = 0
															THEN ''
														ELSE ' near <b>' ||
															 SPLIT_PART((SELECT rendered_content FROM notification_out), ':', 2) ||
															 '</b>'
													END
												 ||
											 '. <a data-underline href="/me/account/login-activity">Click to review</a>',
											 SPLIT_PART((SELECT rendered_content FROM notification_out), ':', 1)
									 )
									 )
				)
				-- Friend request accept
				WHEN
					entity_type = 3
					THEN (WITH transmitter AS (SELECT notifier.name,
													  notifier.username
											   FROM
												   notification_outs n_out
													   -- Join notification
													   INNER JOIN notifications n
																  ON n_out.notification_id = n.id
													   -- Join notifier
													   INNER JOIN users AS notifier
																  ON notifier.id = n.notifier_id
											   WHERE
													 n_out.notification_id = nu.notification_id
												 AND n_out.notified_id = nu.notified_id
											  )
						  SELECT (
									 FORMAT('<a data-fw-bold href="/%s">%s</a> accepted your friend request',
											(SELECT username FROM transmitter),
											(SELECT public.truncate_str(name, 32) FROM transmitter)
									 )
									 )
				)
				-- Friend request received
				WHEN
					entity_type = 4
					THEN (WITH transmitter AS (SELECT notifier.name,
													  notifier.username
											   FROM
												   notification_outs n_out
													   -- Join notification
													   INNER JOIN notifications n
																  ON n_out.notification_id = n.id
													   -- Join notifier
													   INNER JOIN users AS notifier
																  ON notifier.id = n.notifier_id

											   WHERE
													 n_out.notification_id = nu.notification_id
												 AND n_out.notified_id = nu.notified_id
											  )
						  SELECT (
									 FORMAT(
											 '<a data-fw-bold href="/%s">%s</a> sent you a friend request.'
												 ||
											 ' <a data-underline href="/me/content/relations?tab=friends">View all friend requests</a>',
											 (SELECT username FROM transmitter),
											 (SELECT public.truncate_str(name, 32) FROM transmitter)
									 )
									 )
				)
				-- Follower add
				WHEN
					entity_type = 5
					THEN (WITH follower AS (SELECT notifier.name,
												   notifier.username
											FROM
												notification_outs n_out
													-- Join notification
													INNER JOIN notifications n
															   ON n_out.notification_id = n.id
													-- Join notifier
													INNER JOIN users AS notifier
															   ON notifier.id = n.notifier_id

											WHERE
												  n_out.notification_id = nu.notification_id
											  AND n_out.notified_id = nu.notified_id
										   )
						  SELECT (
									 FORMAT('<a data-fw-bold href="/%s">%s</a> started following you',
											(SELECT username FROM follower),
											(SELECT public.truncate_str(name, 32) FROM follower)
									 )
									 )
				)
				-- Comment add
				WHEN
					entity_type = 6
					THEN (WITH comment AS (SELECT c.content,
												  "c->user".username AS "username",
												  "c->user".name     AS "name",
												  ("c->story->user".username || '/' || "c->story".slug || '/' ||
												   'comments' ||
												   '/' || c.id)      AS "url"
										   FROM
											   notification_outs n_out
												   -- Join notification
												   INNER JOIN notifications n
															  ON n_out.notification_id = n.id
												   -- Join comment
												   INNER JOIN comments c
															  ON c.id = n.entity_id
												   -- Join comment user
												   INNER JOIN users AS "c->user"
															  ON "c->user".id = c.user_id
												   -- Join comment story
												   INNER JOIN stories AS "c->story"
															  ON "c->story".id = c.story_id
												   -- Join comment story user
												   INNER JOIN users AS "c->story->user"
															  ON "c->story->user".id = "c->story".user_id
										   WHERE
												 n_out.notification_id = nu.notification_id
											 AND n_out.notified_id = nu.notified_id
										  )
						  SELECT (
									 FORMAT(
											 '<a data-fw-bold href="/%s">%s</a>'
												 || ' commented: '
												 || '<a data-fw-medium href="/%s">%s</a>',
											 (SELECT username FROM comment),
											 (SELECT public.truncate_str(name, 32) FROM comment),
											 (SELECT url FROM comment),
											 (SELECT public.truncate_str(content, 96) FROM comment)
									 )
									 )
				)
				-- Reply add
				WHEN
					entity_type = 7
					THEN (WITH reply AS (SELECT r.content,
												"r->user".username                         AS "username",
												"r->user".name                             AS "name",
												("r->comment->story->user".username || '/' ||
												 "r->comment->story".slug ||
												 '/' ||
												 'comments' ||
												 '/' || r.comment_id || '?reply=' || r.id) AS "url"
										 FROM
											 notification_outs n_out
												 -- Join notification
												 INNER JOIN notifications n
															ON n_out.notification_id = n.id
												 -- Join reply
												 INNER JOIN replies r
															ON r.id = n.entity_id
												 -- Join reply user
												 INNER JOIN users AS "r->user"
															ON "r->user".id = r.user_id
												 -- Join comment
												 INNER JOIN comments AS "r->comment"
															ON "r->comment".id = r.comment_id
												 -- Join comment story
												 INNER JOIN stories AS "r->comment->story"
															ON "r->comment->story".id = "r->comment".story_id
												 -- Join comment story user
												 INNER JOIN users AS "r->comment->story->user"
															ON "r->comment->story->user".id = "r->comment->story".user_id
										 WHERE
											   n_out.notification_id = nu.notification_id
										   AND n_out.notified_id = nu.notified_id
										)
						  SELECT (
									 FORMAT(
											 '<a data-fw-bold href="/%s">%s</a>'
												 || ' replied: '
												 || '<a data-fw-medium href="/%s">%s</a>',
											 (SELECT username FROM reply),
											 (SELECT public.truncate_str(name, 32) FROM reply),
											 (SELECT url FROM reply),
											 (SELECT public.truncate_str(content, 96) FROM reply)
									 )
									 )
				)
				-- TODO: Story mention (8)
				-- Story like
				WHEN
					entity_type = 9
					THEN (WITH story AS (SELECT s.title,
												notifier.username                     AS "username",
												notifier.name                         AS "name",
												("s->user".username || '/' || s.slug) AS "url"
										 FROM
											 notification_outs n_out
												 -- Join notification
												 INNER JOIN notifications n
															ON n_out.notification_id = n.id
												 -- Join notifier
												 INNER JOIN users AS notifier
															ON notifier.id = n.notifier_id
												 -- Join story
												 INNER JOIN stories s
															ON s.id = n.entity_id
												 -- Join story user
												 INNER JOIN users AS "s->user"
															ON "s->user".id = s.user_id
										 WHERE
											   n_out.notification_id = nu.notification_id
										   AND n_out.notified_id = nu.notified_id
										)
						  SELECT (
									 FORMAT(
											 '<a data-fw-bold href="/%s">%s</a>'
												 || ' liked your story: '
												 || '<a data-fw-medium href="/%s">%s</a>',
											 (SELECT username FROM story),
											 (SELECT public.truncate_str(name, 32) FROM story),
											 (SELECT url FROM story),
											 (SELECT public.truncate_str(title, 96) FROM story)
									 )
									 )
				)
				-- Story add by user
				WHEN
					entity_type = 10
					THEN (WITH story AS (SELECT s.title,
												notifier.username                     AS "username",
												notifier.name                         AS "name",
												("s->user".username || '/' || s.slug) AS "url"
										 FROM
											 notification_outs n_out
												 -- Join notification
												 INNER JOIN notifications n
															ON n_out.notification_id = n.id
												 -- Join notifier
												 INNER JOIN users AS notifier
															ON notifier.id = n.notifier_id
												 -- Join story
												 INNER JOIN stories s
															ON s.id = n.entity_id
												 -- Join story user
												 INNER JOIN users AS "s->user"
															ON "s->user".id = s.user_id
										 WHERE
											   n_out.notification_id = nu.notification_id
										   AND n_out.notified_id = nu.notified_id
										)
						  SELECT (
									 FORMAT(
											 '<a data-fw-bold href="/%s">%s</a>'
												 || ' published a new story: '
												 || '<a data-fw-medium href="/%s">%s</a>',
											 (SELECT username FROM story),
											 (SELECT public.truncate_str(name, 32) FROM story),
											 (SELECT url FROM story),
											 (SELECT public.truncate_str(title, 96) FROM story)
									 )
									 )
				)
				-- Story add by tag
				WHEN
					entity_type = 11
					THEN (WITH story AS (SELECT "st->tag".name                                          AS "tag_name",
												"st->story".title,
												("st->story->user".username || '/' || "st->story".slug) AS "url"
										 FROM
											 notification_outs n_out
												 -- Join notification
												 INNER JOIN notifications n
															ON n_out.notification_id = n.id
												 -- Join story tag
												 INNER JOIN story_tags AS st
															ON st.id = n.entity_id
												 -- Join tag
												 INNER JOIN tags AS "st->tag"
															ON "st->tag".id = st.tag_id
												 -- Join story
												 INNER JOIN stories AS "st->story"
															ON "st->story".id = st.story_id
												 -- Join story user
												 INNER JOIN users AS "st->story->user"
															ON "st->story->user".id = "st->story".user_id
										 WHERE
											   n_out.notification_id = nu.notification_id
										   AND n_out.notified_id = nu.notified_id
										)
						  SELECT (
									 FORMAT(
											 'New story published in ' ||
											 '<a data-fw-bold href="/tag/%s">#%s</a>'
												 || ': '
												 || '<a data-fw-medium href="/%s">%s</a>',
											 (SELECT tag_name FROM story),
											 (SELECT tag_name FROM story),
											 (SELECT url FROM story),
											 (SELECT public.truncate_str(title, 96) FROM story)
									 )
									 )
				)
				-- Collaboration request accept
				WHEN
					entity_type = 12
					THEN (WITH contributor AS (SELECT "sc->user".name,
													  "sc->user".username
											   FROM
												   notification_outs n_out
													   -- Join notification
													   INNER JOIN notifications n
																  ON n_out.notification_id = n.id
													   -- Join contributor relation
													   INNER JOIN story_contributors AS sc
																  ON sc.id = n.entity_id
													   -- Join contributor user
													   INNER JOIN users AS "sc->user"
																  ON "sc->user".id = sc.user_id
											   WHERE
													 n_out.notification_id = nu.notification_id
												 AND n_out.notified_id = nu.notified_id
											  )
						  SELECT (
									 FORMAT('<a data-fw-bold href="/%s">%s</a> accepted your collaboration request',
											(SELECT username FROM contributor),
											(SELECT public.truncate_str(name, 32) FROM contributor)
									 )
									 )
				)
				-- Collaboration request received
				WHEN
					entity_type = 13
					THEN (WITH story AS (SELECT s.title,
												notifier.username AS "username",
												notifier.name     AS "name"
										 FROM
											 notification_outs n_out
												 -- Join notification
												 INNER JOIN notifications n
															ON n_out.notification_id = n.id
												 -- Join notifier
												 INNER JOIN users AS notifier
															ON notifier.id = n.notifier_id
												 -- Join contributor relation
												 INNER JOIN story_contributors AS sc
															ON sc.id = n.entity_id
												 -- Join contributor story
												 INNER JOIN stories s
															ON s.id = sc.story_id
										 WHERE
											   n_out.notification_id = nu.notification_id
										   AND n_out.notified_id = nu.notified_id
										)
						  SELECT (
									 FORMAT(
											 '<a data-fw-bold href="/%s">%s</a>'
												 || ' invited you to contribute to their story: '
												 || '<span data-fw-medium>%s</span>.'
												 ||
											 ' <a data-underline href="/me/content/contributions">View all collaboration requests</a>',
											 (SELECT username FROM story),
											 (SELECT public.truncate_str(name, 32) FROM story),
											 (SELECT public.truncate_str(title, 96) FROM story)
									 )
									 )
				)
				-- Unknown
				ELSE 'Unknown notification'
			END
			);
END;
$$ LANGUAGE plpgsql;
