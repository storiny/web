import "little-state-machine";

import { LoginSchema } from "../src/app/(auth)/auth/(segmented)/@login/schema";
import { AuthSegment } from "../src/app/(auth)/state";

declare module "little-state-machine" {
  interface GlobalState {
    auth: {
      segment: AuthSegment;
    };
    login_data: LoginSchema | null;
    mfa_code: string | null;
    recovery: {
      email: string;
    };
    reset_password: { token: null | string };
    signup: {
      email: string;
      name: string;
      password: string;
      username: string;
      wpm: null | number;
    };
    signup_errors: Partial<{
      base: any;
      username: any;
      wpm_manual: any;
    }>;
  }
}
