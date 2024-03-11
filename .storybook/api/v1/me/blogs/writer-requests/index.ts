import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;
const MOCK_MEMBER_REQUESTS = MOCK_USERS.map((user) => ({
  user,
  id: nanoid(),
  created_at: new Date().toJSON(),
}));

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/writer-requests`,
    (req, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json(
          MOCK_MEMBER_REQUESTS.slice(0, 10).map((request) => ({
            ...request,
            id: nanoid(),
            created_at: new Date().toJSON(),
          })),
        ),
      ),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/writer-requests/:request_id/cancel`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
