import { clsx } from "clsx";
import React from "react";

import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

const EditorToc = (): React.ReactElement => (
  <div className={"flex-col"}>
    <div className={clsx("flex-center")}>
      <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
        Table of contents
      </Typography>
      <Spacer className={"f-grow"} />
      <Link
        aria-label={"Disable table of contents"}
        href={"#"}
        level={"body2"}
        title={"Disable table of contents"}
        underline={"always"}
      >
        Disable
      </Link>
    </div>
    <Spacer orientation={"vertical"} size={2} />
  </div>
);

export default EditorToc;
