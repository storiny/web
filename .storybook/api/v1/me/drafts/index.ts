import { mockStories } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/me/drafts`, (req, res, ctx) =>
    res(
      ctx.delay(1200),
      ctx.json(
        mockStories
          .slice(0, 10)
          .map((story) => ({ ...story, id: nanoid(), published_at: null }))
      )
    )
  )
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/drafts/:draftId`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/drafts/:draftId/recover`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
