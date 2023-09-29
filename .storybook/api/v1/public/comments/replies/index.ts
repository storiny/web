import { MOCK_REPLIES } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/comments/:comment_id/replies`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_REPLIES.slice(0, 10).map((reply) => ({
            ...reply,
            id: nanoid(),
            hidden: req.url.searchParams.get("type") === "hidden",
          }))
        )
      )
  )
);

export {};
