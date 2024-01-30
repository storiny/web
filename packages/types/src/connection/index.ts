import { ConnectionProvider } from "@storiny/shared";

import { User } from "../user";

interface ConnectionOptionalProps {
  user?: User;
}

export type Connection<Server extends boolean> = {
  created_at: string;
  id: string;
  provider: ConnectionProvider;
  user_id: string;
} & ConnectionOptionalProps &
  (Server extends true
    ? // The identifier is transformed into absolute URL on the server before arriving at the client.
      { identifier: string }
    : { url: string });
