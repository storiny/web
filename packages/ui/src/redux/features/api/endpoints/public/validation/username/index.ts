import { ContentType } from "@storiny/shared";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "public/validation/username";

export type UsernameValidationResponse = void;
export interface UsernameValidationPayload {
  username: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const usernameValidation = (builder: ApiQueryBuilder) =>
  builder.mutation<UsernameValidationResponse, UsernameValidationPayload>({
    query: (body) => ({
      url: `/${SEGMENT}`,
      method: "POST",
      body,
      headers: {
        "Content-type": ContentType.JSON,
      },
    }),
  });
