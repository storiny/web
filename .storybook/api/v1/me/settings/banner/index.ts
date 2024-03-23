import { MOCK_USERS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/settings/banner`,
    (_, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json({
          avatar_id: MOCK_USERS[6].banner_id,
          avatar_hex: MOCK_USERS[6].banner_hex,
        }),
      ),
  ),
);

export {};
