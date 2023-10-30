import { MOCK_TAGS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/followed-tags`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_TAGS.slice(0, 10).map((tag) => ({
            ...tag,
            id: nanoid(),
            is_following: true,
          })),
        ),
      ),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/followed-tags/:tag_id`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(201)),
  ),
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/followed-tags/:tag_id`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
