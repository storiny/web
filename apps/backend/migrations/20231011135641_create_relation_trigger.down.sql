DROP TRIGGER IF EXISTS relation_before_insert_trigger ON relations;

DROP FUNCTION IF EXISTS relation_before_insert_trigger_proc(
);

DROP TRIGGER IF EXISTS relation_after_insert_trigger ON relations;

DROP FUNCTION IF EXISTS relation_after_insert_trigger_proc(
);

DROP TRIGGER IF EXISTS relation_update_trigger ON relations;

DROP FUNCTION IF EXISTS relation_update_trigger_proc(
);

DROP TRIGGER IF EXISTS relation_delete_trigger ON relations;

DROP FUNCTION IF EXISTS relation_delete_trigger_proc(
);

