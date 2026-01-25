import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import LeftSidebar from "~/layout/left-sidebar";

const SuspendedBlogDashboardLeftSidebarContent = dynamic(
  () => import("./content"),
  {
    loading: dynamic_loader()
  }
);

const BlogDashboardLeftSidebar = (): React.ReactElement => (
  <LeftSidebar
    component_props={{
      wrapper: {
        style: {
          paddingInline: 0,

          paddingBottom: 0
        }
      }
    }}
  >
    <SuspendedBlogDashboardLeftSidebarContent />
  </LeftSidebar>
);

export default BlogDashboardLeftSidebar;
