import "./metadata";
import "./publish";
import "./recover";
import "./unpublish";
import "./stats";
import "./contributors";
import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories`,
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

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:story_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
