import React from "react";

import Footer from "~/layout/footer";

const WithFooterLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <main data-root={"true"}>{children}</main>
    <Footer />
  </>
);

export default WithFooterLayout;
