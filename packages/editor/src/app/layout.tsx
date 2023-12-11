import "~/theme/global.scss";
import "~/theme/main.module.scss";
import "~/theme/storybook.scss";

import React from "react";

const RootLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <html lang="en">
    <body dir={"ltr"}>{children}</body>
  </html>
);

export default RootLayout;
