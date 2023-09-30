import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { GetTagResponse } from "~/common/grpc";
import RightSidebar from "../../../../../../../../packages/ui/src/layout/right-sidebar";

const SuspendedTagRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
});

interface Props {
  tag: GetTagResponse;
}

const TagRightSidebar = ({ tag }: Props): React.ReactElement => (
  <RightSidebar>
    <SuspendedTagRightSidebarContent tag={tag} />
  </RightSidebar>
);

export default TagRightSidebar;
