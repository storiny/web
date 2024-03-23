import { MOCK_BLOGS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/appearance/mark`,
    (_, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json({
          mark_light: MOCK_BLOGS[1].mark_light,
          mark_dark: MOCK_BLOGS[1].mark_dark,
        }),
      ),
  ),
);

export {};
