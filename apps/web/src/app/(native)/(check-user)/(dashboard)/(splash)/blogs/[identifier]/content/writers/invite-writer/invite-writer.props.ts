import { SubmitHandler } from "~/components/form";

import { InviteWriterSchema } from "./invite-writer.schema";

export interface InviteWriterProps {
  on_submit?: SubmitHandler<InviteWriterSchema>;
}
