import React from "react";

import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

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
      <Typography className={"t-minor"} level={"body2"}>
        {has_password
          ? "Changing your password will log you out of all the devices that you have been logged into, except for this device, and you will need to log in to them again."
          : "You initially signed up through one of our social login providers. We highly recommend that you add a password to your account, as this will allow you to log in using both your e-mail and password, in addition to the social login."}
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      {has_password ? <UpdatePassword /> : <AddPassword />}
    </React.Fragment>
  );
};

export default CredentialsPasswordSettings;
