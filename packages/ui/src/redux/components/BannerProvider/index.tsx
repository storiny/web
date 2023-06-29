"use client";

import React from "react";
import useResizeObserver from "use-resize-observer";

import Banner, { BannerProvider } from "~/components/Banner";
import { selectBannerState } from "~/redux/features/banner/selectors";
import { setBannerHeight, setBannerOpen } from "~/redux/features/banner/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

const BannerWithState = () => {
  const dispatch = useAppDispatch();
  const { open, color, icon, message } = useAppSelector(selectBannerState);
  const { ref, height = 1 } = useResizeObserver<HTMLLIElement>({
    box: "border-box",
  });

  /*
   Observes the height of the banner element and sets it as a variable on the body element,
   so that a margin can be added to the Navbar component to avoid the overlap. Also dispatches
   it to the store, allowing sticky elements to consume it and update their top positions.
   */
  React.useEffect(() => {
    if (open) {
      document.body.style.setProperty("--banner-height", `${height}px`);
      dispatch(setBannerHeight(height));
    } else {
      document.body.style.removeProperty("--banner-height");
      dispatch(setBannerHeight(0));
    }
  }, [open, dispatch, height]);

  return (
    <BannerProvider>
      <Banner
        color={color}
        icon={icon}
        onOpenChange={(newState) => dispatch(setBannerOpen(newState))}
        open={open}
        ref={ref}
      >
        {message}
      </Banner>
    </BannerProvider>
  );
};

export default BannerWithState;
