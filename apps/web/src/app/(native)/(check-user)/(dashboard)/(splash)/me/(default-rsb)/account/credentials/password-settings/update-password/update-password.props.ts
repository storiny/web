import { SubmitHandler } from "~/components/form";

import { UpdatePasswordSchema } from "./update-password.schema";

export interface UpdatePasswordProps {
  on_submit?: SubmitHandler<UpdatePasswordSchema>;
}
