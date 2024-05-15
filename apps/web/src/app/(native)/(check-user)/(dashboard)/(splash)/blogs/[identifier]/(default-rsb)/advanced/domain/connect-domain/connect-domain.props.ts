import { SubmitHandler } from "~/components/form";

import { ConnectDomainSchema } from "./connect-domain.schema";

export interface ConnectDomainProps {
  on_connect?: () => void;
  on_submit?: SubmitHandler<ConnectDomainSchema>;
}
