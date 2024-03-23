import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { GetBlogArchiveResponse } from "~/common/grpc";
import Separator from "~/components/separator";
import { DefaultBlogRightSidebarContent } from "~/layout/blog-right-sidebar";
import RightSidebar from "~/layout/right-sidebar";

const SuspendedArchiveRightSidebarContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
});

interface Props {
  archive: GetBlogArchiveResponse;
}

const ArchiveRightSidebar = ({ archive }: Props): React.ReactElement => (
  <RightSidebar is_blog>
    <DefaultBlogRightSidebarContent />
    <Separator />
    <SuspendedArchiveRightSidebarContent archive={archive} />
  </RightSidebar>
);

export default ArchiveRightSidebar;
