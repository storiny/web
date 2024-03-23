import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/content/pending-stories`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_STORIES.slice(0, 10).map((story, index) => ({
            ...story,
            id: nanoid(),
            published_at: index % 2 === 0 ? null : story.published_at,
          })),
        ),
      ),
  ),
);

export {};
