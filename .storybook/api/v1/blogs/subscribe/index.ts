const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/blogs/:blog_id/subscribe`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(201)),
  ),
);

export {};
