import { SubmitHandler } from "~/components/form";

import { DeleteAccountSchema } from "./delete-account.schema";

export interface DeleteAccountProps {
  on_submit?: SubmitHandler<DeleteAccountSchema>;
}
