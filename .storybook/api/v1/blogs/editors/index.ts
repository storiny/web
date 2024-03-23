import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/blogs/:blog_id/editors`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_USERS.slice(0, 10).map((user) => ({
            ...user,
            id: nanoid(),
          })),
        ),
      ),
  ),
);

export {};
