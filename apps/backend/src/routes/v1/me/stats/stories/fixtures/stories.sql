INSERT INTO
	users (id, name, username, email)
VALUES (1, 'Sample user 1', 'sample_user_1', 'sample.1@example.com'),
	   (2, 'Sample user 2', 'sample_user_2', 'sample.2@example.com'),
	   (3, 'Sample user 3', 'sample_user_3', 'sample.3@example.com'),
	   (4, 'Sample user 4', 'sample_user_4', 'sample.4@example.com'),
	   (5, 'Sample user 5', 'sample_user_5', 'sample.5@example.com');

INSERT INTO
	relations (follower_id, followed_id, created_at, subscribed_at)
VALUES (2, 1, '2024-01-01'::TIMESTAMPTZ, NOW()),
	   (3, 1, '2024-01-01'::TIMESTAMPTZ - INTERVAL '45 days', NULL),
	   (4, 1, NOW() - INTERVAL '120 days', NULL);

--

-- latest_story_id: Option<String>,
-- read_mercator: sqlx::types::Json<HashMap<String, i32>>,
-- read_timeline: sqlx::types::Json<HashMap<String, i32>>,
-- reading_time_last_month: i32,
-- reading_time_this_month: i32,
-- reads_last_month: i32,
-- reads_last_three_months: i32,
-- reads_this_month: i32,
-- referral_map: sqlx::types::Json<HashMap<String, i32>>,
-- returning_readers: i32,
-- total_reads: i32,
-- total_views: i64,

WITH total_stats AS (
	SELECT SUM(view_count) AS view_count,
	       SUM(read_count) AS read_count
	FROM
		stories
	WHERE
		  user_id = $1
	  AND published_at IS NOT NULL
	  AND deleted_at IS NULL
						 ),
	 follower_count AS (
		 SELECT follower_count AS count
		 FROM users
		 WHERE
			 id = $1
						 ),
	 follows_since_90_days AS (
		 SELECT created_at
		 FROM relations
		 WHERE
			   followed_id = $1
		   AND created_at > NOW() - INTERVAL '90 days'
		   AND deleted_at IS NULL
						 ),
	 follows_this_month AS (
		 SELECT COUNT(*) AS count
		 FROM follows_since_90_days
		 WHERE
			 created_at > NOW() - INTERVAL '30 days'
						 ),
	 follows_last_month AS (
		 SELECT COUNT(*) AS count
		 FROM follows_since_90_days
		 WHERE
			   created_at < NOW() - INTERVAL '30 days'
		   AND created_at > NOW() - INTERVAL '60 days'
						 ),
	 follow_timeline AS (
		 SELECT JSON_OBJECT_AGG(
						created_at, count
				) AS map
		 FROM (
				  SELECT created_at::DATE, COUNT(*) AS count
				  FROM follows_since_90_days
				  GROUP BY created_at::DATE
				  ORDER BY created_at::DATE
			  ) AS result
						 )
SELECT (SELECT count::INT4 FROM subscriber_count)   AS "total_subscribers",
	   (SELECT count::INT4 FROM follower_count)     AS "total_followers",
	   (SELECT count::INT4 FROM follows_this_month) AS "follows_this_month",
	   (SELECT count::INT4 FROM follows_last_month) AS "follows_last_month",
	   (SELECT map FROM follow_timeline)      AS "follow_timeline";