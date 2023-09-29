import React from "react";

import { use_media_query } from "../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import Footer from "../../../../../../../../../../packages/ui/src/layout/footer";
import { BREAKPOINTS } from "~/theme/breakpoints";

const DashboardFooter = (): React.ReactElement | null => {
  const should_render = use_media_query(BREAKPOINTS.down("desktop"));

  if (!should_render) {
    return null;
  }

  return <Footer />;
};

export default DashboardFooter;
