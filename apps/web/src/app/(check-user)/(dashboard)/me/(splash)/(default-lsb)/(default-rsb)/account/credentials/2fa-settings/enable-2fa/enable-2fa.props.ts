import React from "react";

import { SubmitHandler } from "../../../../../../../../../../../../../../packages/ui/src/components/form";

import { Enable2FASchema } from "./enable-2fa.schema";

export interface Enable2FAProps {
  has_password: boolean;
  on_submit?: SubmitHandler<Enable2FASchema>;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}
