import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import CustomState from "~/entities/custom-state";
import LockExclamationIcon from "~/icons/lock-exclamation";
import UnlinkIcon from "~/icons/unlink";
import css from "~/theme/main.module.scss";

import DashboardGroup from "../../../../dashboard-group";
import DashboardTitle from "../../../../dashboard-title";
import DashboardWrapper from "../../../../dashboard-wrapper";
import { ConnectionFailureProps } from "./failure.props";

const ConnectionFailureClient = ({
  type,
  display_name
}: ConnectionFailureProps): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle
      back_button_href={"/me/settings/connections"}
      hide_back_button={false}
    >
      Connection failure
    </DashboardTitle>
    <DashboardWrapper>
      <DashboardGroup>
        <CustomState
          auto_size
          description={
            type === "state-mismatch" ? (
              <React.Fragment>
                We were unable to securely link your {display_name} account to
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
                We were unable to connect your {display_name} account to your
                Storiny account due to an unexpected error. Please check if your
                {display_name} account is active and publicly accessible, then
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
        <div className={css["flex-center"]}>
          <Button
            as={NextLink}
            auto_size
            check_auth
            className={css["fit-w"]}
            href={"/me/settings/connections"}
          >
            Go back to connections
          </Button>
        </div>
      </DashboardGroup>
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default ConnectionFailureClient;
