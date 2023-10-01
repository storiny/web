import React from "react";

import { SubmitHandler } from "~/components/form";

import { Enable2FASchema } from "./enable-2fa.schema";

export interface Enable2FAProps {
  has_password: boolean;
  on_submit?: SubmitHandler<Enable2FASchema>;
  set_enabled: React.Dispatch<React.SetStateAction<boolean>>;
}
