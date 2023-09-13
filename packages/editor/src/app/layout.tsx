import "normalize.css/normalize.css";
import "~/theme/main.scss";

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
