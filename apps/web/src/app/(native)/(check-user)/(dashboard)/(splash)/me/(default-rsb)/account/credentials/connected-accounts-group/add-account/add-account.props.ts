import { SubmitHandler } from "~/components/form";

import { AccountActionSchema } from "../account-action.schema";

export interface AddAccountProps {
  disabled?: boolean;
  on_submit?: SubmitHandler<AccountActionSchema>;
  vendor: "Apple" | "Google";
}
