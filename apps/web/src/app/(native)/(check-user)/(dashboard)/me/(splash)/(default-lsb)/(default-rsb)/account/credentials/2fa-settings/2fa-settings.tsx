import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
import { clsx } from "clsx";
import React from "react";

import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./2fa-settings.module.scss";
import { TwoFactorAuthSettingsProps } from "./2fa-settings.props";
import Enable2FA from "./enable-2fa";
import RecoveryCodes from "./recovery-codes";
import Remove2FA from "./remove-2fa";

const CredentialsTwoFactorAuthSettings = ({
  has_password,
  mfa_enabled
}: TwoFactorAuthSettingsProps): React.ReactElement => {
  const [enabled, set_enabled] = React.useState<boolean>(mfa_enabled);

  /**
   * Memoized state dispatcher
   */
  const set_enabled_impl = React.useCallback(set_enabled, [set_enabled]);

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Two-factor authentication
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography className={css["t-minor"]} level={"body2"}>
        By requiring more than just a password to sign in, two-factor
        authentication (2FA for short) adds an extra layer of security to your
        account.{" "}
        <Link
          href={SUPPORT_ARTICLE_MAP.TWO_FA}
          target={"_blank"}
          underline={"always"}
        >
          Learn more about two-factor authentication
        </Link>
        .
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      {enabled ? (
        <div className={clsx(css["flex"], styles.actions)}>
          <RecoveryCodes />
          <Remove2FA set_enabled={set_enabled_impl} />
        </div>
      ) : (
        <React.Fragment>
          <Enable2FA
            has_password={has_password}
            set_enabled={set_enabled_impl}
          />
          {!has_password && (
            <React.Fragment>
              <Spacer orientation={"vertical"} size={1.5} />
              <Typography className={css["t-minor"]} level={"body3"}>
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
