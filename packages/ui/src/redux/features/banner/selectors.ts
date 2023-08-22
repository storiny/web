import { AppState } from "~/redux/store";

import { BannerState } from "./slice";

export const selectBannerState = (state: AppState): BannerState => state.banner;

export const selectBannerHeight = (state: AppState): number =>
  state.banner.height;
