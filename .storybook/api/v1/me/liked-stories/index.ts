import { mockStories } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/liked-stories`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          mockStories
            .slice(0, 10)
            .map((story) => ({ ...story, is_liked: true, id: nanoid() }))
        )
      )
  )
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/liked-stories/:storyId`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(201))
  )
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/liked-stories/:storyId`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
