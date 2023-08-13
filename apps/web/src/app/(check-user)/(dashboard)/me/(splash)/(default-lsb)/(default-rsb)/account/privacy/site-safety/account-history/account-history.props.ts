import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/Form";

import { AccountHistorySchema } from "./account-history.schema";

export type AccountHistoryProps = {
  onSubmit?: SubmitHandler<AccountHistorySchema>;
} & Pick<GetPrivacySettingsResponse, "record_read_history">;
