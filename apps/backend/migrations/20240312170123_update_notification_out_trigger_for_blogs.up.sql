CREATE OR REPLACE FUNCTION notification_out_trigger_proc(
)
	RETURNS TRIGGER
AS
$$
BEGIN
	-- Check whether the notified is soft-deleted/deactivated
	IF (EXISTS(SELECT 1
			   FROM
				   users
			   WHERE
					 id = NEW.notified_id
				 AND (deleted_at IS NOT NULL OR deactivated_at IS NOT NULL)
			  )) THEN
		RAISE 'Notifier is soft-deleted/deactivated'
			USING ERRCODE = '52001';
	END IF;
	--
	-- Check whether the notified user has muted or blocked the notifier user
	IF (EXISTS(SELECT 1
			   FROM
				   mutes
					   INNER JOIN notifications n
								  ON n.id = NEW.notification_id
			   WHERE
					 muter_id = NEW.notified_id
				 AND muted_id = n.notifier_id
			  ) OR EXISTS(SELECT 1
						  FROM
							  blocks
								  INNER JOIN notifications n
											 ON n.id = NEW.notification_id
						  WHERE
								blocker_id = NEW.notified_id
							AND blocked_id = n.notifier_id
						 )) THEN
		-- Skip inserting the row
		RETURN NULL;
	END IF;
	--
	-- Check notification settings of the notified user
	IF (EXISTS(SELECT 1
			   FROM
				   notification_settings ns
					   INNER JOIN notifications n
								  ON n.id = NEW.notification_id
			   WHERE
				   ns.user_id = NEW.notified_id
					   AND (
					   -- 3 = Friend request accept, 4 = Friend request received
					   (ns.push_friend_requests IS FALSE AND n.entity_type IN (3, 4)) OR
						   -- 5 = Follower add
					   (ns.push_followers IS FALSE AND n.entity_type = 5) OR
						   -- 6 = Comment add
					   (ns.push_comments IS FALSE AND n.entity_type = 6) OR
						   -- 7 = Reply add
					   (ns.push_replies IS FALSE AND n.entity_type = 7) OR
						   -- 10 = Story add by user, 11 = Story add by tag
					   (ns.push_stories IS FALSE AND n.entity_type IN (10, 11)) OR
						   -- 9 = Story like
					   (ns.push_story_likes IS FALSE AND n.entity_type = 9))
				 OR
				   -- 12 = Collaboration request accept, 13 = Collaboration request received
				   (ns.push_collaboration_requests IS FALSE AND n.entity_type IN (12, 13))
				 OR
				   -- 14 = Blog editor invite, 15 = Blog writer invite
				   (ns.push_blog_requests IS FALSE AND n.entity_type IN (14, 15))
			  )) THEN
		-- Skip inserting the row
		RETURN NULL;
	END IF;
	--
	RETURN NEW;
END;
$$
	LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER notification_out_trigger
	BEFORE INSERT
	ON notification_outs
	FOR EACH ROW
EXECUTE PROCEDURE notification_out_trigger_proc();

