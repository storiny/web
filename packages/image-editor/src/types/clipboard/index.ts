import { Spreadsheet } from "../../lib/chart/charts";
import { BinaryFiles } from "../binary";
import { Layer } from "../layer";

export interface ClipboardData {
  errorMessage?: string;
  files?: BinaryFiles;
  layers?: readonly Layer[];
  spreadsheet?: Spreadsheet;
  text?: string;
}
