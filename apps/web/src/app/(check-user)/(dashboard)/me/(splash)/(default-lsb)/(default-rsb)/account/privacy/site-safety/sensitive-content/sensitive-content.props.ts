import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/Form";

import { SensitiveContentSchema } from "./sensitive-content.schema";

export type SensitiveContentProps = {
  onSubmit?: SubmitHandler<SensitiveContentSchema>;
} & Pick<GetPrivacySettingsResponse, "allow_sensitive_media">;
