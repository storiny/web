import { MOCK_BLOGS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/banner`,
    (_, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json({
          avatar_id: MOCK_BLOGS[1].banner_id,
          avatar_hex: MOCK_BLOGS[1].banner_hex,
        }),
      ),
  ),
);

export {};
