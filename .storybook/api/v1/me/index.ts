import "./bookmarks";
import "./liked-stories";
import "./liked-comments";
import "./liked-replies";
import "./history";
import "./unread-notifications";
import "./notifications";
import "./friend-requests";
import "./gallery";
import "./assets";
import "./drafts";
import "./comments";
import "./replies";
import "./stories";
import "./settings";
import "./followed-tags";
import "./relations";
import "./blocked-users";
import "./muted-users";
import "./account-activity";
import "./following";
import "./followers";
import "./friends";

import { mockUsers } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/me`, (req, res, ctx) =>
    res(ctx.delay(1200), ctx.json(mockUsers[4]))
  )
);

export {};
