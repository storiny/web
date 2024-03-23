import { MOCK_BLOGS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;
const MOCK_BLOG_REQUESTS = MOCK_BLOGS.map((blog, index) => ({
  blog,
  id: nanoid(),
  role: index % 2 === 0 ? "editor" : "writer",
  created_at: new Date().toJSON(),
}));

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blog-requests`,
    (req, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json(
          MOCK_BLOG_REQUESTS.slice(0, 10).map((blog_request) => ({
            ...blog_request,
            id: nanoid(),
            created_at: new Date().toJSON(),
          })),
        ),
      ),
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blog-requests/:request_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/blog-requests/:request_id`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
