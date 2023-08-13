import { SubmitHandler } from "~/components/Form";

import { UsernameSettingsSchema } from "./username-settings.schema";

export interface UsernameSettingsProps {
  onSubmit?: SubmitHandler<UsernameSettingsSchema>;
}
