import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import AddPassword from "./add-password";
import { PasswordSettingsProps } from "./password-settings.props";
import UpdatePassword from "./update-password";

const CredentialsPasswordSettings = (
  props: PasswordSettingsProps
): React.ReactElement => {
  const { has_password } = props;
  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Password
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography className={css["t-minor"]} level={"body2"}>
        {has_password
          ? "Changing your password will log you out of all the devices that you have been logged into, including this device, and you will need to log in to them again."
          : "You have signed up through one of our social login providers. We highly recommend that you add a password to your account. This will allow you to log in using both your e-mail and password, and your social account."}
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      {has_password ? <UpdatePassword /> : <AddPassword />}
    </React.Fragment>
  );
};

export default CredentialsPasswordSettings;
