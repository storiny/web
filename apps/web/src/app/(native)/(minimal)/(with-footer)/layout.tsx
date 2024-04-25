import React from "react";

import Main from "~/components/main";
import Footer from "~/layout/footer";

const WithFooterLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <Main>{children}</Main>
    <Footer />
  </>
);

export default WithFooterLayout;
