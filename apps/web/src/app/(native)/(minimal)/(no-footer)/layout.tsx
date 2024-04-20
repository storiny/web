import React from "react";

import Main from "~/components/main";

const NoFooterLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => <Main>{children}</Main>;

export default NoFooterLayout;
