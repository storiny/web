import dynamic from "next/dynamic";
import React from "react";

import { GetTagResponse } from "~/common/grpc";
import SuspenseLoader from "~/common/suspense-loader";
import RightSidebar from "~/layout/RightSidebar";

const SuspendedTagRightSidebarContent = dynamic(() => import("./content"), {
  loading: () => <SuspenseLoader />,
});

interface Props {
  tag: GetTagResponse;
}

const TagRightSidebar = ({ tag }: Props) => (
  <RightSidebar>
    <SuspendedTagRightSidebarContent tag={tag} />
  </RightSidebar>
);

export default TagRightSidebar;
