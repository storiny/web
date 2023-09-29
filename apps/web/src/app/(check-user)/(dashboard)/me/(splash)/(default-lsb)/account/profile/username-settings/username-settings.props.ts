import { SubmitHandler } from "../../../../../../../../../../../../packages/ui/src/components/form";

import { UsernameSettingsSchema } from "./username-settings.schema";

export interface UsernameSettingsProps {
  on_submit?: SubmitHandler<UsernameSettingsSchema>;
}
