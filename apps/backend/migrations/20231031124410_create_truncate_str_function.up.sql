-- Truncates a string to the `max_len`, with a delimiter
CREATE OR REPLACE FUNCTION "public"."truncate_str"(
	str     TEXT,
	max_len NUMERIC
) RETURNS TEXT AS
$$
BEGIN
	RETURN
		(
			CASE
				WHEN LENGTH(str) > max_len
					THEN
					CONCAT(CAST(LEFT(str, max_len::INTEGER) AS TEXT), '…')
				ELSE str
			END
			);
END;
$$ LANGUAGE plpgsql;