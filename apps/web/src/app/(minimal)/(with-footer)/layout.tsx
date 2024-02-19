import React from "react";

import Footer from "~/layout/footer";

import MembershipNotice from "./membership/notice";

const WithFooterLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <>
    <main data-root={"true"}>{children}</main>
    <Footer>
      <MembershipNotice />
    </Footer>
  </>
);

export default WithFooterLayout;
