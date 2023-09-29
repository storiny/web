import { SubmitHandler } from "../../../../../../../../../../../../../../packages/ui/src/components/form";

import { AddPasswordSchema } from "./add-password.schema";

export interface AddPasswordProps {
  on_submit?: SubmitHandler<AddPasswordSchema>;
}
