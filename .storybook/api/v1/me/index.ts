import "./bookmarks";
import "./liked-stories";
import "./history";
import "./unread-notifications";
import "./notifications";
import "./gallery";
import "./assets";
import "./drafts";
import "./comments";
import "./replies";
import "./stories";
import "./settings";
import "./validation";

import { mockUsers } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/me`, (req, res, ctx) =>
    res(ctx.delay(1200), ctx.json(mockUsers[4]))
  )
);

export {};
