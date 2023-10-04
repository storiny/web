DROP      DOMAIN IF EXISTS "public"."asset_key";

DROP      DOMAIN IF EXISTS "public"."hex_color";

-- Although this ID/key is assigned on the server, still check it for sanity
CREATE    DOMAIN "public"."asset_key" AS text CONSTRAINT asset_key_length CHECK (CHAR_LENGTH(value) <= 128);

-- Hex color without the `#` prefix
CREATE    DOMAIN "public"."hex_color" AS char(6) CONSTRAINT hex_color_constraint CHECK (value ~* '^[a-f0-9]{6}$');
