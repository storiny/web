import { mockComments } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/stories/:storyId/comments`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          mockComments.slice(0, 10).map((comment) => ({
            ...comment,
            id: nanoid(),
            hidden: req.url.searchParams.get("type") === "hidden",
          }))
        )
      )
  )
);

export {};
