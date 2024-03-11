const { worker, rest } = window.msw;

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/writers/:user_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/writers`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
