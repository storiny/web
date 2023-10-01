import React from "react";

import { SubmitHandler } from "~/components/form";

import { Remove2FASchema } from "./remove-2fa.schema";

export interface Remove2FAProps {
  on_submit?: SubmitHandler<Remove2FASchema>;
  set_enabled: React.Dispatch<React.SetStateAction<boolean>>;
}
