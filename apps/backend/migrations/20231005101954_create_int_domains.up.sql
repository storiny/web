DROP DOMAIN IF EXISTS "public"."unsigned_int32";

DROP DOMAIN IF EXISTS "public"."unsigned_int64";

CREATE DOMAIN "public"."unsigned_int32" AS integer CONSTRAINT unsigned_int32_size CHECK (value >= 0);

CREATE DOMAIN "public"."unsigned_int64" AS bigint CONSTRAINT unsigned_int64_size CHECK (value >= 0);

