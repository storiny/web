DROP DOMAIN IF EXISTS "public"."rendered_markdown_text";

-- Markdown text converted into HTML string on the server
CREATE DOMAIN "public"."rendered_markdown_text" AS TEXT NOT NULL DEFAULT '';

