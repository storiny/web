import { SubmitHandler } from "~/components/Form";

import { AccountGeneralSchema } from "./general-form.schema";

export interface GeneralFormProps {
  onSubmit?: SubmitHandler<AccountGeneralSchema>;
}
