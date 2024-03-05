import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/content/published-stories`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_STORIES.slice(0, 10).map((story) => ({
            ...story,
            id: nanoid(),
          })),
        ),
      ),
  ),
);

export {};
