import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

import DashboardGroup from "../../../../../common/dashboard-group";
import CodeBlockSettings from "./settings";

const ReadingFontPreference = (): React.ReactElement => (
  <DashboardGroup>
    <Typography as={"h2"} level={"h4"}>
      Code block preference
    </Typography>
    <Spacer orientation={"vertical"} size={3} />
    <CodeBlockSettings />
  </DashboardGroup>
);

export default ReadingFontPreference;
