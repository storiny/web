import { mockStories } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:storyId/metadata`,
    (req, res, ctx) => res(ctx.delay(750), ctx.json(mockStories[5]))
  )
);

export {};
