import { Story, Tag, User } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "rsb-content";

export interface GetRightSidebarContentResponse {
  stories: Story[];
  tags: Tag[];
  users: User[];
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getRightSidebarContent = (builder: ApiQueryBuilder) =>
  builder.query<GetRightSidebarContentResponse, void>({
    query: () => `/${SEGMENT}`
  });
