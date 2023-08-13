import React from "react";

import { SubmitHandler } from "~/components/Form";

import { Remove2FASchema } from "./remove-2fa.schema";

export interface Remove2FAProps {
  onSubmit?: SubmitHandler<Remove2FASchema>;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}
