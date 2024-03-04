const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/appearance/theme`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(200)),
  ),
);

export {};
