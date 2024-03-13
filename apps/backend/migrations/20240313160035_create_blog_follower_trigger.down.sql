DROP TRIGGER IF EXISTS blog_follower_before_insert_trigger ON blog_followers;

DROP FUNCTION IF EXISTS blog_follower_before_insert_trigger_proc;

DROP TRIGGER IF EXISTS blog_follower_after_insert_trigger ON blog_followers;

DROP FUNCTION IF EXISTS blog_follower_after_insert_trigger_proc;

DROP TRIGGER IF EXISTS blog_follower_before_update_trigger ON blog_followers;

DROP FUNCTION IF EXISTS blog_follower_before_update_trigger_proc;

DROP TRIGGER IF EXISTS blog_follower_delete_trigger ON blog_followers;

DROP FUNCTION IF EXISTS blog_follower_delete_trigger_proc;
