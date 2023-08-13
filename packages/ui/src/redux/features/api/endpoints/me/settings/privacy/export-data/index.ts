import { ContentType } from "@storiny/shared";
import { ExportDataSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/export-data-group";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/export-data";

export interface ExportDataResponse {}
export type ExportDataPayload = ExportDataSchema;

export const { useExportDataMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    exportData: builder.mutation<ExportDataResponse, ExportDataPayload>({
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
