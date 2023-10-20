-- pgfmt-ignore TODO: Remove this comment once pgFormatter handles CTE

WITH friends_and_following_stories AS (
    SELECT
        -- Story
        s.id,
        s.title,
        s.slug AS "slug!",
        s.description,
        s.splash_id,
        s.splash_hex,
        s.category::TEXT AS "category!",
        s.age_restriction,
        s.license,
        s.user_id,
        -- Stats
        s.word_count,
        s.read_count,
        s.like_count,
        s.comment_count,
        -- Timestamps
        s.published_at AS "published_at!",
        s.edited_at,
        -- Boolean flags
        CASE WHEN count("s->is_bookmarked") = 1 THEN
            TRUE
        ELSE
            FALSE
        END AS "is_bookmarked!",
        CASE WHEN count("s->is_liked") = 1 THEN
            TRUE
        ELSE
            FALSE
        END AS "is_liked!",
        -- User
        json_build_object('id', u.id, 'name', u.name, 'username', u.username, 'avatar_id', u.avatar_id, 'avatar_hex', u.avatar_hex, 'public_flags', u.public_flags) AS "user!: Json<User>",
        -- Tags
        coalesce(array_agg(("s->story_tags->tag".id, "s->story_tags->tag".name)) FILTER (WHERE "s->story_tags->tag".id IS NOT NULL), '{}') AS "tags!: Vec<Tag>"
    FROM
        stories s
        INNER JOIN users u ON u.id = s.user_id
            AND u.deleted_at IS NULL
            AND u.deactivated_at IS NULL
            -- Filter out stories from blocked and muted users
            AND u.id NOT IN (
                SELECT
                    b.blocked_id
                FROM
                    blocks b
            WHERE
                b.blocker_id = $1
            UNION
            SELECT
                m.muted_id
            FROM
                mutes m
            WHERE
                m.muter_id = $1)
  --
            -- Join story tags
        LEFT OUTER JOIN story_tags AS "s->story_tags"
    -- Join tags
    INNER JOIN tags AS "s->story_tags->tag" ON "s->story_tags->tag".id = "s->story_tags".tag_id
    --
    ON "s->story_tags".story_id = s.id
    -- Boolean bookmark flag
        LEFT OUTER JOIN bookmarks AS "s->is_bookmarked" ON "s->is_bookmarked".story_id = s.id
            AND "s->is_bookmarked".user_id = $1
            AND "s->is_bookmarked".deleted_at IS NULL
            -- Boolean story like flag
        LEFT OUTER JOIN story_likes AS "s->is_liked" ON "s->is_liked".story_id = s.id
        AND "s->is_liked".user_id = $1
        AND "s->is_liked".deleted_at IS NULL
    WHERE
        -- Public
        s.visibility = 2
        AND s.user_id IN (
            -- Friends received by current user
            SELECT
                transmitter_id
            FROM friends f
            WHERE
                f.receiver_id = $1
                AND f.accepted_at IS NOT NULL
                AND f.deleted_at IS NULL
            UNION
            -- Friends transmitted by current user
            SELECT
                receiver_id
            FROM friends f
            WHERE
                f.transmitter_id = $1
                AND f.accepted_at IS NOT NULL
                AND f.deleted_at IS NULL
            UNION
            -- Users being followed by the current user
            SELECT
                followed_id
            FROM relations r
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
        u.id,
        s.published_at
    ORDER BY
        -- Sort by `published_at` as the user usually would want to
        -- see the latest stories from friends and following users.
        s.published_at DESC
    LIMIT $2 OFFSET $3
)
SELECT
    -- Story
    id,
    title,
    "slug!",
    description,
    splash_id,
    splash_hex,
    "category!",
    age_restriction,
    license,
    user_id,
    -- Stats
    word_count,
    read_count,
    like_count,
    comment_count,
    -- Timestamps
    "published_at!",
    edited_at,
    -- Boolean flags
    "is_bookmarked!",
    "is_liked!",
    -- Joins
    "user!: Json<User>",
    "tags!: Vec<Tag>"
FROM
    friends_and_following_stories;

