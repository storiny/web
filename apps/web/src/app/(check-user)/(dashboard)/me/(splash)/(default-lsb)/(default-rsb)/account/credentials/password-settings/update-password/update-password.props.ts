import { SubmitHandler } from "~/components/Form";

import { UpdatePasswordSchema } from "./update-password.schema";

export interface UpdatePasswordProps {
  onSubmit?: SubmitHandler<UpdatePasswordSchema>;
}
