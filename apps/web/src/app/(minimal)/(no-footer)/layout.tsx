import React from "react";

const NoFooterLayout = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => <main>{children}</main>;

export default NoFooterLayout;
