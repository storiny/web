SELECT
    -- Story
    s.id,
    s.title,
    s.slug,
    s.description,
    s.splash_id,
    s.splash_hex,
    s.category::text,
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
(u.id, u.name, u.username, u.avatar_id, u.avatar_hex, u.public_flags) AS "user!: Json<User>",
    -- Tags
    array_agg((t.id, t.name)) AS "tags!: Vec<Tag>"
FROM
    stories s
    INNER JOIN users u ON u.id = s.user_id
        AND u.deleted_at IS NULL
        AND u.deactivated_at IS NULL
        -- Join tags
    LEFT OUTER JOIN story_tags st
INNER JOIN tags t ON t.id = st.tag_id ON st.story_id = s.id
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
    u.id
ORDER BY
    -- Sort by `published_at` as the user usually would want to
    -- see the latest stories from friends and following users.
    s.published_at DESC
LIMIT $2
