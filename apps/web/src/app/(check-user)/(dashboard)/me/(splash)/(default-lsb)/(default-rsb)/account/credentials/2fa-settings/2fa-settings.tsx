import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import styles from "./2fa-settings.module.scss";
import { TwoFactorAuthSettingsProps } from "./2fa-settings.props";
import Enable2FA from "./enable-2fa";
import Remove2FA from "./remove-2fa";

const CredentialsTwoFactorAuthSettings = ({
  has_password,
  mfa_enabled
}: TwoFactorAuthSettingsProps): React.ReactElement => {
  const [enabled, setEnabled] = React.useState<boolean>(mfa_enabled);

  /**
   * Memoized state dispatcher
   */
  const setEnabledImpl = React.useCallback(setEnabled, [setEnabled]);

  return (
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
      {enabled ? (
        <div className={clsx("flex", styles.actions)}>
          <Button autoSize className={"fit-w"} variant={"hollow"}>
            View recovery codes
          </Button>
          <Remove2FA setEnabled={setEnabledImpl} />
        </div>
      ) : (
        <React.Fragment>
          <Enable2FA has_password={has_password} setEnabled={setEnabledImpl} />
          {!has_password && (
            <React.Fragment>
              <Spacer orientation={"vertical"} size={1.5} />
              <Typography className={"t-minor"} level={"body3"}>
                To enable two-factor authentication, you need to add a password
                to your account.
              </Typography>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default CredentialsTwoFactorAuthSettings;
