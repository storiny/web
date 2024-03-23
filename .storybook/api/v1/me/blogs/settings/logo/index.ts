import { MOCK_BLOGS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/logo`,
    (_, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json({
          logo_id: MOCK_BLOGS[1].logo_id,
          logo_hex: MOCK_BLOGS[1].logo_hex,
        }),
      ),
  ),
);

export {};
