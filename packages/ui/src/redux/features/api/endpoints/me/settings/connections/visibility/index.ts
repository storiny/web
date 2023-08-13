import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/settings/connections/${id}/visibility`;

export interface ConnectionVisibilitySettingsResponse {}
export type ConnectionVisibilitySettingsPayload = {
  id: string;
  visible: boolean;
};

export const { useConnectionVisibilityMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    connectionVisibility: builder.mutation<
      ConnectionVisibilitySettingsResponse,
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
