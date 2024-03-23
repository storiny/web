import { SubmitHandler } from "~/components/form";

import { BlogConnectionsSchema } from "./connections.schema";

export interface BlogConnectionsFormProps {
  on_submit?: SubmitHandler<BlogConnectionsSchema>;
}
