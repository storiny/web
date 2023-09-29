import { SubmitHandler } from "../../../../../../../../../../../../../../packages/ui/src/components/form";

import { RemoveAccountSchema } from "./remove-account.schema";

export interface RemoveAccountProps {
  onRemove: () => void;
  on_submit?: SubmitHandler<RemoveAccountSchema>;
  vendor: "Apple" | "Google";
}
