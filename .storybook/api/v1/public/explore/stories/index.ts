import { mockStories } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = (window as any).msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/explore/stories`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          mockStories.slice(0, 10).map((story) => ({ ...story, id: nanoid() }))
        )
      )
  )
);

export {};
