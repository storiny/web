import "little-state-machine";

import { UseFormReturn } from "react-hook-form";

import { LoginSchema } from "../src/app/(auth)/auth/(segmented)/@login/schema";
import { SignupBaseSchema } from "../src/app/(auth)/auth/(segmented)/@signup_base/schema";
import { SignupUsernameSchema } from "../src/app/(auth)/auth/(segmented)/@signup_username/schema";
import { SignupWPMSchema } from "../src/app/(auth)/auth/(segmented)/@signup_wpm_manual/schema";
import { AuthSegment } from "../src/app/(auth)/state";

declare module "little-state-machine" {
  interface GlobalState {
    auth: {
      segment: AuthSegment;
    };
    forms: {
      signup_base: UseFormReturn<SignupBaseSchema>;
      signup_username: UseFormReturn<SignupUsernameSchema>;
      wpm_manual: UseFormReturn<SignupWPMSchema>;
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
  }
}
