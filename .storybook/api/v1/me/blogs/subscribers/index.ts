import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

const MOCK_SUBSCRIBERS = MOCK_USERS.map((user) => ({
  email: user.email,
}));

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/subscribers`,
    (req, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json(
          MOCK_SUBSCRIBERS.slice(0, 10).map((subscriber) => ({
            ...subscriber,
            id: nanoid(),
            created_at: new Date().toJSON(),
          })),
        ),
      ),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/subscribers/import`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(201)),
  ),
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/subscribers/:subscriber_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
