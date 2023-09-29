import { SubmitHandler } from "../../../../../../../../../../../../packages/ui/src/components/form";

import { AccountGeneralSchema } from "./general-form.schema";

export interface GeneralFormProps {
  on_submit?: SubmitHandler<AccountGeneralSchema>;
}
