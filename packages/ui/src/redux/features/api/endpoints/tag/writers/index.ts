import { User } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = (tagName: string): string => `tag/${tagName}/writers`;

export type GetTagWritersResponse = User[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getTagWriters = (builder: ApiQueryBuilder) =>
  builder.query<GetTagWritersResponse, { tagName: string }>({
    query: ({ tagName }) => `/${SEGMENT(tagName)}`
  });
