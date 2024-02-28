import { SubmitHandler } from "~/components/form";

import { UsernameSettingsSchema } from "./username-settings.schema";

export interface UsernameSettingsProps {
  on_submit?: SubmitHandler<UsernameSettingsSchema>;
}
