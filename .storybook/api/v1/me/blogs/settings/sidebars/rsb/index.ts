import { MOCK_BLOGS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/sidebars/rsb`,
    async (req, res, ctx) => {
      return res(ctx.delay(750), ctx.json(MOCK_BLOGS[0].rsb_items));
    },
  ),
);

export {};
