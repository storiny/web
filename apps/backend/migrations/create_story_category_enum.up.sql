DROP TYPE IF EXISTS "public"."story_category";

CREATE    TYPE "public"."story_category" as ENUM(
'business-and-finance',
'digital-graphics',
'diy',
'entertainment',
'gaming',
'health-and-wellness',
'learning',
'lifestyle',
'music',
'news',
'others',
'programming',
'science-and-technology',
'sports',
'travel'
);
