import NextLink from "next/link";
import React from "react";

import Button from "~/components/Button";
import Link from "~/components/Link";
import CustomState from "~/entities/CustomState";
import LockExclamationIcon from "~/icons/LockExclamation";
import UnlinkIcon from "~/icons/Unlink";

import DashboardGroup from "../../../../dashboard-group";
import DashboardTitle from "../../../../dashboard-title";
import DashboardWrapper from "../../../../dashboard-wrapper";
import { ConnectionFailureProps } from "./failure.props";

const ConnectionFailureClient = ({
  type,
  displayName
}: ConnectionFailureProps): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle
      backButtonHref={"/me/settings/connections"}
      hideBackButton={false}
    >
      Connection failure
    </DashboardTitle>
    <DashboardWrapper>
      <DashboardGroup>
        <CustomState
          autoSize
          description={
            type === "state-mismatch" ? (
              <React.Fragment>
                We were unable to securely link your {displayName} account to
                your Storiny account due to the state parameter being unable to
                maintain its identity during the round trip. You can try
                authorizing it again, or contact{" "}
                <Link href={"/support"} underline={"always"}>
                  support
                </Link>{" "}
                if the issue persists.
              </React.Fragment>
            ) : (
              <React.Fragment>
                We were unable to connect your {displayName} account to your
                Storiny account due to an unexpected error. Please check if your
                {displayName} account is active and publicly accessible, then
                try again. If the issue persists, please{" "}
                <Link href={"/support"} underline={"always"}>
                  contact support
                </Link>
                .
              </React.Fragment>
            )
          }
          icon={
            type === "state-mismatch" ? <LockExclamationIcon /> : <UnlinkIcon />
          }
          title={type === "state-mismatch" ? "State mismatch" : "Linking error"}
        />
        <div className={"flex-center"}>
          <Button
            as={NextLink}
            autoSize
            className={"fit-w"}
            href={"/me/settings/connections"}
          >
            Go back to connections
          </Button>
        </div>
      </DashboardGroup>
    </DashboardWrapper>
  </React.Fragment>
);

export default ConnectionFailureClient;
