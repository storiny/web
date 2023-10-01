import { SubmitHandler } from "~/components/form";

import { AccountGeneralSchema } from "./general-form.schema";

export interface GeneralFormProps {
  on_submit?: SubmitHandler<AccountGeneralSchema>;
}
