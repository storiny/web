DROP FUNCTION IF EXISTS convert_draft_tags_to_story_tags;

DROP TRIGGER IF EXISTS story_before_insert_trigger ON stories;

DROP FUNCTION IF EXISTS story_before_insert_trigger_proc;

DROP TRIGGER IF EXISTS story_after_insert_trigger ON stories;

DROP FUNCTION IF EXISTS story_after_insert_trigger_proc;

DROP TRIGGER IF EXISTS story_before_update_trigger ON stories;

DROP FUNCTION IF EXISTS story_before_update_trigger_proc;

DROP TRIGGER IF EXISTS story_after_update_trigger ON stories;

DROP FUNCTION IF EXISTS story_after_update_trigger_proc;

DROP TRIGGER IF EXISTS story_delete_trigger ON stories;

DROP FUNCTION IF EXISTS story_delete_trigger_proc;

