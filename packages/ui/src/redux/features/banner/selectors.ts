import { AppState } from "~/redux/store";

export const selectBannerState = (state: AppState) => state.banner;

export const selectBannerHeight = (state: AppState) => state.banner.height;
