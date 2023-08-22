import { mockUsers } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blocked-users`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          mockUsers
            .slice(0, 10)
            .map((user) => ({ ...user, id: nanoid(), is_blocking: true }))
        )
      )
  )
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blocked-users/:userId`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(201))
  )
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blocked-users/:userId`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
