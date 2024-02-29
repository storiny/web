import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

import DashboardGroup from "../../../../../common/dashboard-group";
import LigaturesPreference from "./ligatures";
import CodeFontTypefacePreference from "./typeface";

const ReadingFontPreference = (): React.ReactElement => (
  <DashboardGroup>
    <Typography as={"h2"} level={"h4"}>
      Code font preference
    </Typography>
    <Spacer orientation={"vertical"} size={3} />
    <CodeFontTypefacePreference />
    <Spacer orientation={"vertical"} size={5} />
    <LigaturesPreference />
  </DashboardGroup>
);

export default ReadingFontPreference;
