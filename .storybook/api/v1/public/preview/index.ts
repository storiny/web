import { mockStories } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/preview/:storyId`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.json(mockStories[8]))
  )
);

export {};
