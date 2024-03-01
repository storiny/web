const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/delete-blog`,
    async (req, res, ctx) => {
      return res(ctx.delay(750), ctx.status(204));
    },
  ),
);

export {};
