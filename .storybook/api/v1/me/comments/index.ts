import { mockComments, mockUsers } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/comments`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          mockComments.slice(0, 10).map((comment) => ({
            ...comment,
            id: nanoid(),
            user_id: mockUsers[4].id,
          }))
        )
      )
  )
);

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/comments/:commentId/edit`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/comments/:commentId`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
