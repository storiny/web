import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/appearance/fonts/upload`,
    (req, res, ctx) =>
      res(ctx.delay(3400), ctx.status(201), ctx.json({ id: nanoid() })),
  ),
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/appearance/fonts/:variant`,
    (req, res, ctx) => res(ctx.delay(500), ctx.status(200)),
  ),
);

export {};
