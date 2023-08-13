import { SubmitHandler } from "~/components/Form";

import { DeleteAccountSchema } from "./delete-account.schema";

export interface DeleteAccountProps {
  onSubmit?: SubmitHandler<DeleteAccountSchema>;
}
