const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:storyId/unpublish`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
