SELECT
    "story"."id",
    "story"."title",
    "story"."slug",
    "story"."description",
    "story"."splash_hash",
    "story"."splash_id",
    "story"."word_count",
    "story"."age_restriction",
    "story"."published_at",
    "story"."pinned_at",
    "story"."edited_at",
    "story"."user_id",
    "story"."published_at"::DATE AS "published_date_only",
    "user"."id" AS "user.id",
    "user"."name" AS "user.name",
    "user"."username" AS "user.username",
    "user"."avatar_id" AS "user.avatar_id",
    "user"."avatar_hash" AS "user.avatar_hash",
    "user"."public_flags" AS "user.public_flags",
    "user"."created_at" AS "user.created_at",
    "category"."id" AS "category.id",
    "category"."label" AS "category.label",
    "stats"."id" AS "stats.id",
    "stats"."total_view_count" AS "stats.total_view_count",
    "stats"."comment_count" AS "stats.comment_count",
    "stats"."like_count" AS "stats.like_count",
    "bookmarks"."id" AS "bookmarks.id",
    count(DISTINCT "story->tags->tag->followers"."id") AS "tag_flag",
    count(DISTINCT "user->followers"."id") AS "relation_flag",
    count(DISTINCT "user->friends"."id") AS "friend_flag",
    coalesce(count(DISTINCT "user->followers"."id"), count(DISTINCT "user->friends"."id")) AS "union_flag",
(coalesce(NULLIF(count(DISTINCT "story->tags->tag->followers"."id") + count(DISTINCT "user->friends"."id") + count(DISTINCT "user->followers"."id") +(
                    CASE WHEN "story"."published_at"::DATE >=(CURRENT_DATE - INTERVAL '1d')::DATE THEN
                        1
                    ELSE
                        CASE WHEN "story"."published_at"::DATE >=(CURRENT_DATE - INTERVAL '7d')::DATE THEN
                            0.5
                        ELSE
                            0
                        END
                    END), 0),(
                CASE WHEN count(DISTINCT "story->histories") > 1 THEN
                    1
                ELSE
                    0
                END))) AS weight,
    count(DISTINCT "story->histories") AS "history_weight"
FROM
    "stories" AS "story"
    INNER JOIN "users" AS "user" ON "story"."user_id" = "user"."id"
        AND ("user"."deleted_at" IS NULL)
    LEFT OUTER JOIN "histories" AS "story->histories" ON "story"."category" =(
    SELECT
        category
    FROM
        stories AS "history_story"
    WHERE
        "history_story"."id" = "story->histories"."story_id")
AND ("story->histories"."user_id" = $ {userId}::BIGINT)
    LEFT OUTER JOIN "friends" AS "user->friends" ON (("story"."user_id" = "user->friends"."transmitter_id"
            AND "user->friends"."receiver_id" = $ {userId}::BIGINT
            AND "user->friends"."accepted_at" IS NOT NULL)
        OR ("story"."user_id" = $ {userId}::BIGINT
            AND "user->friends"."receiver_id" = "user->friends"."transmitter_id"
            AND "user->friends"."accepted_at" IS NOT NULL))
    AND ("user->friends"."deleted_at" IS NULL)
    LEFT OUTER JOIN "relations" AS "user->followers" ON "user"."id" = "user->followers"."followed_id"
    AND ("user->followers"."deleted_at" IS NULL
        AND "user->followers"."follower_id" = $ {userId}::BIGINT)
    LEFT OUTER JOIN "story_tags" AS "story->tags"
INNER JOIN "tags" AS "story->tags->tag" ON "story->tags"."tag_id" = "story->tags->tag"."id"
    AND ("story->tags->tag"."deleted_at" IS NULL)
    LEFT OUTER JOIN "tag_follows" AS "story->tags->tag->followers" ON "story->tags->tag->followers"."user_id" = $ {userId}::BIGINT
    AND ("story->tags->tag->followers"."tag_id" = "story->tags"."tag_id"
        AND "story->tags->tag->followers"."deleted_at" IS NULL) ON "story"."id" = "story->tags"."story_id"
    LEFT OUTER JOIN ("bookmarks" AS "bookmarks->Bookmark"
    INNER JOIN "users" AS "bookmarks" ON "bookmarks"."id" = "bookmarks->Bookmark"."user_id"
        AND ("bookmarks->Bookmark"."deleted_at" IS NULL
            AND "bookmarks->Bookmark"."user_id" = $ {userId}::BIGINT)) ON "story"."id" = "bookmarks->Bookmark"."story_id"
    AND ("bookmarks"."deleted_at" IS NULL)
WHERE ("story"."deleted_at" IS NULL
    AND ("story"."published_at" IS NOT NULL
        AND "story"."visibility" = 'public'
        AND "story"."user_id" NOT IN (
            SELECT
                blocked_id
            FROM
                blocks AS block
            WHERE
                block.blocker_id = $ {userId}::BIGINT
                AND block.deleted_at IS NULL)))
GROUP BY
    "user"."id",
    "story"."id",
    "bookmarks"."id"
ORDER BY
    $ {sort}
LIMIT :limit OFFSET :offset;

