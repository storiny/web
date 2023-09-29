import React from "react";

import { SubmitHandler } from "../../../../../../../../../../../../../../packages/ui/src/components/form";

import { Remove2FASchema } from "./remove-2fa.schema";

export interface Remove2FAProps {
  on_submit?: SubmitHandler<Remove2FASchema>;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}
