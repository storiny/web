import { SubmitHandler } from "~/components/form";

import { ExportDataSchema } from "./export-data-group.schema";

export interface ExportDataGroupProps {
  on_submit?: SubmitHandler<ExportDataSchema>;
}
