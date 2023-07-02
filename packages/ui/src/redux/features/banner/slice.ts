import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { BannerColor, BannerIcon } from "~/components/Banner";

export interface BannerState {
  color: BannerColor;
  // Set using resize observer, for sticky positioning
  height: number;
  icon?: BannerIcon;
  message: string;
  open: boolean;
}

export const bannerInitialState: BannerState = {
  open: false,
  height: 0,
  color: "inverted",
  message: ""
};

export const bannerSlice = createSlice({
  name: "banner",
  initialState: bannerInitialState,
  reducers: {
    setBannerOpen: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload;
    },
    setBannerHeight: (state, action: PayloadAction<number>) => {
      state.height = action.payload;
    },
    renderBanner: (
      state,
      action: PayloadAction<{
        color?: BannerColor;
        icon?: BannerIcon;
        message: string;
      }>
    ) => {
      const { message, color, icon } = action.payload;

      state.open = true;
      state.message = message;
      state.color = color || bannerInitialState.color;
      state.icon = icon || bannerInitialState.icon;
    }
  }
});

const { setBannerOpen, setBannerHeight, renderBanner } = bannerSlice.actions;

export { renderBanner, setBannerHeight, setBannerOpen };

export default bannerSlice.reducer;
