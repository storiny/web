import { SubmitHandler } from "~/components/form";

import { CreateBlogSchema } from "./create-blog.schema";

export interface CreateBlogProps {
  disabled?: boolean;
  on_submit?: SubmitHandler<CreateBlogSchema>;
}
