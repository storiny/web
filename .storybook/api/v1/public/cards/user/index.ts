import { MOCK_USERS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/cards/user/:identifier`,
    (req, res, ctx) => res(ctx.delay(750), ctx.json(MOCK_USERS[4])),
  ),
);

export {};
