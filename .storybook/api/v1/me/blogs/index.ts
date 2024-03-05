import { MOCK_BLOGS, MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";
import "./settings";
import "./leave";
import "./content";

const { worker, rest } = window.msw;

worker.use(
  rest.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs`, (req, res, ctx) =>
    res(
      ctx.delay(1200),
      ctx.json(
        MOCK_BLOGS.slice(0, 10).map((blog, index) => ({
          ...blog,
          id: nanoid(),
          is_owner: blog.user_id === MOCK_USERS[0].id,
          is_editor: index % 2 === 0 && blog.user_id !== MOCK_USERS[0].id,
        })),
      ),
    ),
  ),
);

worker.use(
  rest.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/me/blogs`, (req, res, ctx) =>
    res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
