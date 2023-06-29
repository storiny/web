import "little-state-machine";

import { AuthSegment } from "../src/app/(auth)/state";

declare module "little-state-machine" {
  interface GlobalState {
    auth: {
      segment: AuthSegment;
    };
    recovery: {
      email: string;
    };
    resetPassword: { token: null | string };
    signup: {
      email: string;
      name: string;
      password: string;
      username: string;
      wpm: null | number;
    };
  }
}
