import React from "react";

import { renderBanner } from "~/redux/features/banner/slice";
import { useAppDispatch } from "~/redux/hooks";

import { BannerProps } from "../Banner.props";

export const useBanner = () => {
  const dispatch = useAppDispatch();

  return (
    message: string,
    { icon, color }: Pick<BannerProps, "icon" | "color"> = {}
  ) => {
    dispatch(renderBanner({ message, icon, color }));
  };
};
