import { SubmitHandler } from "~/components/form";

import { AccountActionSchema } from "../account-action.schema";

export interface RemoveAccountProps {
  on_remove: () => void;
  on_submit?: SubmitHandler<AccountActionSchema>;
  vendor: "Apple" | "Google";
}
