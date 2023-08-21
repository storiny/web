import { mockTags } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/me/tags`, (req, res, ctx) =>
    res(
      ctx.delay(1200),
      ctx.json(
        mockTags
          .slice(0, 10)
          .map((tag) => ({ ...tag, id: nanoid(), is_following: true }))
      )
    )
  )
);

export {};
