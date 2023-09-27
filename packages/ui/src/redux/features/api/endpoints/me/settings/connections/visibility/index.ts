import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/settings/connections/${id}/visibility`;

export type ConnectionVisibilitySettingsPayload = {
  id: string;
  visible: boolean;
};

export const {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  useConnectionVisibilityMutation: use_connection_visibility_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    connectionVisibility: builder.mutation<
      void,
      ConnectionVisibilitySettingsPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "PATCH",
        body: { hidden: body.visible },
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
