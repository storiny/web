import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "../../../../../../../../../../../../../../packages/ui/src/components/form";

import { AccountHistorySchema } from "./account-history.schema";

export type AccountHistory_props = {
  on_submit?: SubmitHandler<AccountHistorySchema>;
} & Pick<GetPrivacySettingsResponse, "record_read_history">;
