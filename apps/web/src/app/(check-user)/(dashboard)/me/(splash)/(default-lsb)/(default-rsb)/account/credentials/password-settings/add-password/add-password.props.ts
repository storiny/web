import { SubmitHandler } from "~/components/form";

import { AddPasswordSchema } from "./add-password.schema";

export interface AddPasswordProps {
  on_submit?: SubmitHandler<AddPasswordSchema>;
}
