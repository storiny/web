import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

import DashboardGroup from "../../../../../common/dashboard-group";
import ReadingFontSizePreference from "./font-size";
import ReadingFontTypefacePreference from "./typeface";

const ReadingFontPreference = (): React.ReactElement => (
  <DashboardGroup>
    <Typography as={"h2"} level={"h4"}>
      Reading font preference
    </Typography>
    <Spacer orientation={"vertical"} size={3} />
    <ReadingFontSizePreference />
    <Spacer orientation={"vertical"} size={5} />
    <ReadingFontTypefacePreference />
  </DashboardGroup>
);

export default ReadingFontPreference;
