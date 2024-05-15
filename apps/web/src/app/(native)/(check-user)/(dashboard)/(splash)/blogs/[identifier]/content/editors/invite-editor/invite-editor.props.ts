import { SubmitHandler } from "~/components/form";

import { InviteEditorSchema } from "./invite-editor.schema";

export interface InviteEditorProps {
  on_submit?: SubmitHandler<InviteEditorSchema>;
}
