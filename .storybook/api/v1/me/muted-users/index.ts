import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/muted-users`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_USERS.slice(0, 10).map((user) => ({
            ...user,
            id: nanoid(),
            is_muted: true,
          }))
        )
      )
  )
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/muted-users/:user_id`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(201))
  )
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/muted-users/:user_id`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
