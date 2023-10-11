CREATE OR REPLACE FUNCTION story_tag_trigger_proc()
    RETURNS TRIGGER
    AS $$
BEGIN
    IF(TG_OP = 'INSERT') THEN
        -- Increment `story_count` on tag
        UPDATE
            tags
        SET
            story_count = story_count + 1
        WHERE
            id = NEW.tag_id;
        --
        RETURN NEW;
    ELSIF(TG_OP = 'DELETE') THEN
        -- Decrement `story_count` on tag
        UPDATE
            tags
        SET
            story_count = story_count - 1
        WHERE
            id = OLD.tag_id
            AND story_count > 0;
        --
        RETURN OLD;
    END IF;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER story_tag_trigger
    AFTER INSERT OR DELETE ON story_tags
    FOR EACH ROW
    EXECUTE PROCEDURE story_tag_trigger_proc();

