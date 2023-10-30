import { MOCK_STORIES } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:story_id/metadata`,
    (req, res, ctx) => res(ctx.delay(750), ctx.json(MOCK_STORIES[5])),
  ),
);

export {};
