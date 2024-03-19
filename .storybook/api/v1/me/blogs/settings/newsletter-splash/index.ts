import { MOCK_BLOGS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/newsletter-splash`,
    (_, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json({
          newsletter_splash_id: MOCK_BLOGS[1].newsletter_splash_id,
          newsletter_splash_hex: MOCK_BLOGS[1].newsletter_splash_hex,
        }),
      ),
  ),
);

export {};
