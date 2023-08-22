import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { GetTagResponse } from "~/common/grpc";
import RightSidebar from "~/layout/RightSidebar";

const SuspendedTagRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
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
