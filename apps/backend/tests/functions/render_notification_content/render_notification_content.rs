#[cfg(test)]
mod tests {
    use sqlx::{PgPool, Row};
    use storiny::models::notification::NotificationEntityType;

    #[sqlx::test(fixtures("friend_request_accept"))]
    async fn can_render_notification_content_for_friend_request_accept_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(NotificationEntityType::FriendReqAccept as i16)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"<a data-fw-bold href="/sample_user_2">Sample user 2</a> accepted your friend request"#.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("friend_request_receive"))]
    async fn can_render_notification_content_for_friend_request_receive_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(NotificationEntityType::FriendReqReceived as i16)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"<a data-fw-bold href="/sample_user_1">Sample user 1</a> sent you a friend request"#
                .to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("follower_add"))]
    async fn can_render_notification_content_for_follower_add_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(NotificationEntityType::FollowerAdd as i16)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"<a data-fw-bold href="/sample_user_1">Sample user 1</a> started following you"#
                .to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("comment_add"))]
    async fn can_render_notification_content_for_comment_add_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(NotificationEntityType::CommentAdd as i16)
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"<a data-fw-bold href="/sample_user_2">Sample user 2</a> commented: <a data-fw-medium href="/sample_user_1/sample-story/comments/4">Some content</a>"#
                .to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("reply_add"))]
    async fn can_render_notification_content_for_reply_add_type(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(NotificationEntityType::ReplyAdd as i16)
        .bind(6_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"<a data-fw-bold href="/sample_user_2">Sample user 2</a> replied: <a data-fw-medium href="/sample_user_1/sample-story/comments/4?reply=5">Reply content</a>"#
            .to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story_like"))]
    async fn can_render_notification_content_for_story_like_type(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(NotificationEntityType::StoryLike as i16)
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"<a data-fw-bold href="/sample_user_2">Sample user 2</a> liked your story: <a data-fw-medium href="/sample_user_1/sample-story">Sample story</a>"#
                .to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story_add_by_user"))]
    async fn can_render_notification_content_for_story_add_by_user_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(NotificationEntityType::StoryAddByUser as i16)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"<a data-fw-bold href="/sample_user_1">Sample user 1</a> published a new story: <a data-fw-medium href="/sample_user_1/sample-story">Sample story</a>"#
            .to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story_add_by_tag"))]
    async fn can_render_notification_content_for_story_add_by_tag_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(NotificationEntityType::StoryAddByTag as i16)
        .bind(6_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"New story published in <a data-fw-bold href="/tag/sample-tag">#sample-tag</a>: <a data-fw-medium href="/sample_user_1/sample-story">Sample story</a>"#
            .to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("unknown"))]
    async fn can_render_notification_content_for_unknown_type(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            SELECT
                public.render_notification_content($1, notification_outs.*) AS "content"
            FROM
                notification_outs
            WHERE
                notification_id = $2;
            "#,
        )
        .bind(-1_i16)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("content"),
            r#"Unknown notification"#.to_string()
        );

        Ok(())
    }
}
