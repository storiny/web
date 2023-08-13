import { SubmitHandler } from "~/components/Form";

import { RemoveAccountSchema } from "./remove-account.schema";

export interface RemoveAccountProps {
  onRemove: () => void;
  onSubmit?: SubmitHandler<RemoveAccountSchema>;
  vendor: "Apple" | "Google";
}
