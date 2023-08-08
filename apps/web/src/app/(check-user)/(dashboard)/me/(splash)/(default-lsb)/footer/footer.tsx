import React from "react";

import { useMediaQuery } from "~/hooks/useMediaQuery";
import Footer from "~/layout/Footer";
import { breakpoints } from "~/theme/breakpoints";

const DashboardFooter = (): React.ReactElement | null => {
  const shouldRender = useMediaQuery(breakpoints.down("desktop"));

  if (!shouldRender) {
    return null;
  }

  return <Footer />;
};

export default DashboardFooter;
