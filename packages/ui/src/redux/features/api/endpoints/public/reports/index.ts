import { ContentType } from "@storiny/shared";

import { ReportSchema } from "~/entities/report-modal/schema";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "public/reports";

export interface ReportEntityPayload extends ReportSchema {
  entity_id: string;
}

export const { useReportEntityMutation: use_report_entity_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      reportEntity: builder.mutation<void, ReportEntityPayload>({
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
