import React from "react";

const NoFooterLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => <main data-root={"true"}>{children}</main>;

export default NoFooterLayout;
