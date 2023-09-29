import NextLink from "next/link";
import React from "react";

import Button from "../../../../../../../../packages/ui/src/components/button";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../packages/ui/src/components/typography";

const Page = (): React.ReactElement => (
  <>
    <Typography as={"h1"} level={"h3"}>
      Account held for deletion
    </Typography>
    <Spacer orientation={"vertical"} size={0.5} />
    <Typography className={"t-minor"} level={"body2"}>
      We have received a request for the deletion of this account.
      <br />
      <br />
      However, if you continue to log in, your account will not be deleted in
      accordance to our policy, which includes a grace period of 30 days for
      account recovery. This period provides account owners with ample time to
      reconsider and cancel their deletion request.
    </Typography>
    <Grow />
    <div className={"flex-center"}>
      <Button as={NextLink} className={"full-w"} href={"/"} size={"lg"}>
        Recover account
      </Button>
    </div>
  </>
);

export default Page;
