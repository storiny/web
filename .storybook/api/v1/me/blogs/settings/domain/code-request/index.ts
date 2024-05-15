import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs/:blog_id/settings/domain/code-request`,
    async (req, res, ctx) => {
      return res(
        ctx.delay(750),
        ctx.json({ code: `storiny-blog-verify=${nanoid()}` }),
      );
    },
  ),
);

export {};
