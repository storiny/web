import { mockStories, mockTags, mockUsers } from "@storiny/ui/src/mocks";
import { GetRightSidebarContentResponse } from "@storiny/ui/src/redux";

const { worker, rest } = (window as any).msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/rsb-content`,
    (req, res, ctx) =>
      res(
        ctx.delay(2000),
        ctx.json({
          stories: mockStories.slice(0, 3),
          users: mockUsers.slice(0, 5),
          tags: mockTags.slice(0, 8),
        } as GetRightSidebarContentResponse)
      )
  )
);

export {};
