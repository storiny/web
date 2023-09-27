import { ContentType } from "@storiny/shared";
import { EmailSettingsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/credentials/email-group";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/email";

export type EmailSettingsPayload = EmailSettingsSchema;

export const { useEmailSettingsMutation: use_email_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      emailSettings: builder.mutation<void, EmailSettingsPayload>({
        query: (body) => ({
          url: `/${SEGMENT}`,
          method: "PATCH",
          body,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
