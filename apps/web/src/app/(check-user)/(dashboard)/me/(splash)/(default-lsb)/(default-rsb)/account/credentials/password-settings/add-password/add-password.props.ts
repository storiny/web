import { SubmitHandler } from "~/components/Form";

import { AddPasswordSchema } from "./add-password.schema";

export interface AddPasswordProps {
  onSubmit?: SubmitHandler<AddPasswordSchema>;
}
