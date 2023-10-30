import { MOCK_COMMENTS, MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/comments`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_COMMENTS.slice(0, 10).map((comment) => ({
            ...comment,
            id: nanoid(),
            user_id: MOCK_USERS[4].id,
          })),
        ),
      ),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/comments`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(201)),
  ),
);

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/comments/:comment_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/comments/:comment_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
