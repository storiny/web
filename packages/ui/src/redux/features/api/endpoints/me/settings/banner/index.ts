import { ContentType } from "@storiny/shared";
import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/banner";

export type BannerSettingsResponse = Pick<User, "banner_id" | "banner_hex">;
export interface BannerSettingsPayload {
  banner_id: string | null;
}

export const { useBannerSettingsMutation: use_banner_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
