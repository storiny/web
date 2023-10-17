SELECT
    -- Story
    s.id,
    s.title,
    s.slug,
    s.description,
    s.splash_id,
    s.splash_hex,
    s.category,
    s.age_restriction,
    s.license,
    s.user_id,
    -- Stats
    s.word_count,
    s.read_count,
    s.like_count,
    s.comment_count,
    -- Timestamps
    s.published_at,
    s.edited_at,
    -- User
    u.id AS "user.id",
    u.name AS "user.name",
    u.username AS "user.username",
    u.avatar_id AS "user.avatar_id",
    u.avatar_hex AS "user.avatar_hex",
    u.public_flags AS "user.public_flags",
    -- Weights
    count(DISTINCT "s->histories") AS "histories_weight",
    count(DISTINCT "s->bookmarks") AS "bookmarks_weight"
FROM
    stories s
    INNER JOIN users u ON u.id = s.user_id
        AND u.deleted_at IS NULL
        AND u.deactivated_at IS NULL
        --
        -- Join histories
    LEFT OUTER JOIN histories AS "s->histories" ON s.category != 'others'::story_category
    AND s.category =(
        SELECT
            category
        FROM
            stories hs
    WHERE
        hs.id = "s->histories".story_id
        AND hs.deleted_at IS NULL
        AND hs.published_at IS NOT NULL)
AND "s->histories".user_id = :user_id
AND "s->histories".deleted_at IS NULL
--
-- Join bookmarks
    LEFT OUTER JOIN bookmarks AS "s->bookmarks" ON s.category != 'others'::story_category
    AND s.category =(
        SELECT
            category
        FROM
            stories bs
    WHERE
        bs.id = "s->bookmarks".story_id
        AND bs.deleted_at IS NULL
        AND bs.published_at IS NOT NULL)
AND "s->bookmarks".user_id = :user_id
AND "s->bookmarks".deleted_at IS NULL
--
-- Join tags
    LEFT OUTER JOIN story_tags AS "s->story_tags"
INNER JOIN tag_followers AS "s->story_tags->followers" ON "s->story_tags->followers".tag_id = "s->story_tags".tag_id
    AND "s->story_tags->followers".user_id = :user_id
    AND "s->story_tags->followers".deleted_at IS NULL ON "s->story_tags".story_id = s.id
WHERE
    -- Public
    s.visibility = 2
    AND s.user_id IN (
        -- Friends received by current user
        SELECT
            transmitter_id FROM friends f
            WHERE
                f.receiver_id = $1
                AND f.accepted_at IS NOT NULL
                AND f.deleted_at IS NULL
            UNION
            -- Friends transmitted by current user
            SELECT
                receiver_id FROM friends f
                WHERE
                    f.transmitter_id = $1
                    AND f.accepted_at IS NOT NULL
                    AND f.deleted_at IS NULL
                UNION
                -- Users being followed by the current user
                SELECT
                    followed_id FROM relations r
                    -- Exclude private accounts as they would be included
                    -- in the friends query above.
                    INNER JOIN users ru ON ru.id = r.followed_id
                        AND ru.is_private IS FALSE
                        AND ru.deleted_at IS NULL
                        AND ru.deactivated_at IS NULL
                    WHERE
                        r.follower_id = $1
                        AND r.deleted_at IS NULL)
    AND s.deleted_at IS NULL
    AND s.published_at IS NOT NULL
GROUP BY
    s.id,
    s.published_at
ORDER BY
    -- Sort by `published_at` as the user usually would want to
    -- see the latest stories from friends and following users.
    s.published_at DESC
LIMIT $2
