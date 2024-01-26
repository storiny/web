import { MOCK_STORIES, MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;
const MOCK_COLLABORATION_REQUESTS = MOCK_USERS.map((user, index) => ({
  user: index % 2 == 0 ? null : user,
  id: nanoid(),
  role: "editor",
  story: MOCK_STORIES[index],
  created_at: new Date().toJSON(),
}));

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/collaboration-requests`,
    (req, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json(
          MOCK_COLLABORATION_REQUESTS.slice(0, 10).map(
            (collaboration_request) => ({
              ...collaboration_request,
              id: nanoid(),
              created_at: new Date().toJSON(),
            }),
          ),
        ),
      ),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/collaboration-requests/:user_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/collaboration-requests/:user_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/collaboration-requests/:user_id/cancel`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
