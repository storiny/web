import { mockUsers } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

const handler: Parameters<typeof rest.get>[1] = (req, res, ctx) =>
  res(
    ctx.delay(1200),
    ctx.json(mockUsers.slice(0, 10).map((user) => ({ ...user, id: nanoid() })))
  );

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/user/:userId/followers`,
    handler
  )
);

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/user/:userId/following`,
    handler
  )
);

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/user/:userId/friends`,
    handler
  )
);

export {};
