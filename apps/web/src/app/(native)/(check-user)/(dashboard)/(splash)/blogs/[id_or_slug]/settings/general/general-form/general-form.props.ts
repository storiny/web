import { SubmitHandler } from "~/components/form";

import { BlogGeneralSchema } from "./general-form.schema";

export interface BlogGeneralFormProps {
  on_submit?: SubmitHandler<BlogGeneralSchema>;
}
