import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import styles from "./2fa-settings.module.scss";
import { TwoFactorAuthSettingsProps } from "./2fa-settings.props";

const CredentialsTwoFactorAuthSettings = ({
  has_password,
  is_2fa_enabled
}: TwoFactorAuthSettingsProps): React.ReactElement => (
  <React.Fragment>
    <Typography as={"h3"} level={"h6"}>
      Two-factor authentication
    </Typography>
    <Spacer orientation={"vertical"} />
    <Typography className={"t-minor"} level={"body2"}>
      By requiring more than just a password to sign in, two-factor
      authentication (2FA for short) adds an extra layer of security to your
      account.{" "}
      <Link href={"/guides/two-factor-auth"} underline={"always"}>
        Learn more about two-factor authentication
      </Link>
      .
    </Typography>
    <Spacer orientation={"vertical"} size={3} />
    {!is_2fa_enabled ? (
      <div className={clsx("flex", styles.actions)}>
        <Button autoSize className={"fit-w"} variant={"hollow"}>
          View recovery codes
        </Button>
        <Button autoSize className={"fit-w"} color={"ruby"} variant={"hollow"}>
          Remove 2FA
        </Button>
      </div>
    ) : (
      <React.Fragment>
        <Button autoSize className={"fit-w"} disabled={!has_password}>
          Enable 2FA
        </Button>
        {!has_password && (
          <React.Fragment>
            <Spacer orientation={"vertical"} size={1.5} />
            <Typography className={"t-minor"} level={"body3"}>
              To enable two-factor authentication, you need to add a password to
              your account.
            </Typography>
          </React.Fragment>
        )}
      </React.Fragment>
    )}
  </React.Fragment>
);

export default CredentialsTwoFactorAuthSettings;
