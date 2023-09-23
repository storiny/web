import { mockReplies } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/comments/:commentId/replies`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          mockReplies.slice(0, 10).map((reply) => ({
            ...reply,
            id: nanoid(),
            hidden: req.url.searchParams.get("type") === "hidden",
          }))
        )
      )
  )
);

export {};
