import React from "react";

import Footer from "~/layout/Footer";

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
