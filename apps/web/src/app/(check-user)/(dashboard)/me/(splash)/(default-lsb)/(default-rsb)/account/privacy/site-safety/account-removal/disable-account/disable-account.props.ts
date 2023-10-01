import { SubmitHandler } from "~/components/form";

import { DisableAccountSchema } from "./disable-account.schema";

export interface DisableAccountProps {
  on_submit?: SubmitHandler<DisableAccountSchema>;
}
