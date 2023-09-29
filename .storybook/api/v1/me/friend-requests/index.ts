import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;
const mockFriendRequests = MOCK_USERS.map((user) => ({
  user,
  id: nanoid(),
  created_at: new Date().toJSON(),
}));

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/friend-requests`,
    (req, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json(
          mockFriendRequests.slice(0, 10).map((friend_request) => ({
            ...friend_request,
            id: nanoid(),
            created_at: new Date().toJSON(),
          }))
        )
      )
  )
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/friend-requests/:requestId/accept`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/friend-requests/:requestId/reject`,
    (req, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
