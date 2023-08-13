import { SubmitHandler } from "~/components/Form";

import { ExportDataSchema } from "./export-data-group.schema";

export interface ExportDataGroupProps {
  onSubmit?: SubmitHandler<ExportDataSchema>;
}
