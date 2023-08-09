import { ContentType } from "@storiny/shared";
import { User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/banner";

export type BannerSettingsResponse = Pick<User, "banner_id" | "banner_hex">;
export interface BannerSettingsPayload {
  banner_id: string | null;
  source: "pexels" | "native" | null;
}

export const { useBannerSettingsMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    bannerSettings: builder.mutation<
      BannerSettingsResponse,
      BannerSettingsPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "PATCH",
        body,
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
