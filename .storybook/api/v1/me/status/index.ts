import { MOCK_USERS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/status`,
    (req, res, ctx) => res(ctx.delay(750), ctx.json(MOCK_USERS[5].status))
  )
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/status`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
