import { SubmitHandler } from "~/components/Form";

import { DisableAccountSchema } from "./disable-account.schema";

export interface DisableAccountProps {
  onSubmit?: SubmitHandler<DisableAccountSchema>;
}
