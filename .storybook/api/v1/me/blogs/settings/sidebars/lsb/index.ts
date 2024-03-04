import { MOCK_BLOGS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/sidebars/lsb`,
    async (req, res, ctx) => {
      return res(ctx.delay(750), ctx.json(MOCK_BLOGS[0].lsb_items));
    },
  ),
);

export {};
