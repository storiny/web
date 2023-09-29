import { MOCK_STORIES, MOCK_TAGS, MOCK_USERS } from "@storiny/ui/src/mocks";
import { GetRightSidebarContentResponse } from "@storiny/ui/src/redux";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/rsb-content`,
    (req, res, ctx) =>
      res(
        ctx.delay(2000),
        ctx.json({
          stories: MOCK_STORIES.slice(0, 3),
          users: MOCK_USERS.slice(0, 5),
          tags: MOCK_TAGS.slice(0, 8),
        } as GetRightSidebarContentResponse)
      )
  )
);

export {};
