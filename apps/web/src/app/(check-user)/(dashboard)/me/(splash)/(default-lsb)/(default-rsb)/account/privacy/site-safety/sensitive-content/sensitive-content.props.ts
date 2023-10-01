import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/form";

import { SensitiveContentSchema } from "./sensitive-content.schema";

export type SensitiveContentProps = {
  on_submit?: SubmitHandler<SensitiveContentSchema>;
} & Pick<GetPrivacySettingsResponse, "allow_sensitive_media">;
