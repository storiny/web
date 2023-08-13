import React from "react";

import { SubmitHandler } from "~/components/Form";

import { Enable2FASchema } from "./enable-2fa.schema";

export interface Enable2FAProps {
  has_password: boolean;
  onSubmit?: SubmitHandler<Enable2FASchema>;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}
