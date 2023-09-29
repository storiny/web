import React from "react";

import Footer from "../../../../../../packages/ui/src/layout/footer";

const WithFooterLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <main>{children}</main>
    <Footer />
  </>
);

export default WithFooterLayout;
