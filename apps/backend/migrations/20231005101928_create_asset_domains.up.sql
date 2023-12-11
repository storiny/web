DROP DOMAIN IF EXISTS "public"."hex_color";

-- Hex color without the `#` prefix
CREATE DOMAIN "public"."hex_color" AS TEXT CONSTRAINT hex_color_constraint CHECK (value ~* '^[a-f0-9]{6}$');
