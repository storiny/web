import { MOCK_BLOGS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/appearance/favicon`,
    (_, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json({
          favicon: MOCK_BLOGS[1].favicon,
        }),
      ),
  ),
);

export {};
