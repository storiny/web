CREATE SEQUENCE IF NOT EXISTS "public"."snowflake_sequence";

CREATE OR REPLACE FUNCTION "public"."next_snowflake" (OUT result BIGINT)
AS $$
DECLARE
    -- alpha
    storiny_epoch BIGINT := 1696561864000;
    seq_id BIGINT;
    now_millis BIGINT;
    shard_id INT := 1;
BEGIN
    SELECT
        nextval('public.snowflake_sequence') % 1024 INTO seq_id;
    SELECT
        floor(extract(EPOCH FROM clock_timestamp()) * 1000) INTO now_millis;
    result := (now_millis - storiny_epoch) << 23;
    result := result | (shard_id << 10);
    result := result | (seq_id);
END;
$$
LANGUAGE plpgsql;

