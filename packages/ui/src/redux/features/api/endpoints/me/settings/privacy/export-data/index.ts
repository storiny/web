import { ContentType } from "@storiny/shared";
import { ExportDataSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/export-data-group";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/export-data";

export type ExportDataPayload = ExportDataSchema;

export const { useExportDataMutation: use_export_data_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      exportData: builder.mutation<void, ExportDataPayload>({
        query: (body) => ({
          url: `/${SEGMENT}`,
          method: "POST",
          body,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
