import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;
const MOCK_CONTRIBUTORS = MOCK_USERS.slice(0, 5).map((user, index) => ({
  user: index % 2 === 0 ? user : null,
  user_id: user.id,
  id: nanoid(),
  has_accepted: index % 2 === 0,
  role: index % 2 === 0 ? "editor" : "viewer",
  created_at: new Date().toJSON(),
}));

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:story_id/contributors`,
    (req, res, ctx) => res(ctx.delay(750), ctx.json(MOCK_CONTRIBUTORS)),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:story_id/contributors/:username`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:story_id/contributors/:user_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:story_id/contributors/:user_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
