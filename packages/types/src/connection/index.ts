import { Provider } from "@storiny/shared";

export type TProvider = (typeof Provider)[keyof typeof Provider];

export type Connection<Server extends boolean> = {
  created_at: string;
  id: string;
  provider: TProvider;
} & (Server extends true
  ? // Identifier is transformed into absolute URL on the server before arriving at the client.
    { identifier: string }
  : { url: string });
