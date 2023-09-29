import { SubmitHandler } from "../../../../../../../../../../../../../../../packages/ui/src/components/form";

import { DisableAccountSchema } from "./disable-account.schema";

export interface DisableAccountProps {
  on_submit?: SubmitHandler<DisableAccountSchema>;
}
