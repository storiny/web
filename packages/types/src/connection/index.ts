import { Provider } from "@storiny/proto/dist/connection_def/v1/def";

import { User } from "../user";

export type TProvider = (typeof Provider)[keyof typeof Provider];

interface ConnectionOptionalProps {
  user?: User;
}

export type Connection<Server extends boolean> = {
  created_at: string;
  id: string;
  provider: TProvider;
  user_id: string;
} & ConnectionOptionalProps &
  (Server extends true
    ? // The Identifier is transformed into absolute URL on the server before arriving at the client.
      { identifier: string }
    : { url: string });
