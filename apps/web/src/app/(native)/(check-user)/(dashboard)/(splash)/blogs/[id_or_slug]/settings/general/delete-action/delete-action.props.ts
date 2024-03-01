import { SubmitHandler } from "~/components/form";

import { BlogDeleteActionSchema } from "./delete-action.schema";

export interface DeleteActionProps {
  on_submit?: SubmitHandler<BlogDeleteActionSchema>;
}
