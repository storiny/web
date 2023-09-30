import { MOCK_USERS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/tag/:tag_name/writers`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.json(MOCK_USERS.slice(0, 5)))
  )
);

export {};
