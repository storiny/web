import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

const handler: Parameters<typeof rest.get>[1] = (req, res, ctx) =>
  res(
    ctx.delay(1200),
    ctx.json(
      MOCK_USERS.slice(0, 10).map((user) => ({ ...user, id: nanoid() })),
    ),
  );

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/:user_id/followers`,
    handler,
  ),
);

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/:user_id/following`,
    handler,
  ),
);

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/:user_id/friends`,
    handler,
  ),
);

export {};
