import { SubmitHandler } from "~/components/form";

import { RemoveAccountSchema } from "./remove-account.schema";

export interface RemoveAccountProps {
  on_remove: () => void;
  on_submit?: SubmitHandler<RemoveAccountSchema>;
  vendor: "Apple" | "Google";
}
