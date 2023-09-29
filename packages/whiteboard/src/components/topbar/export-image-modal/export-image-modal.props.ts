export interface ExportImageModalProps {
  /**
   * Boolean flag indicating whether the sketch is being confirmed
   */
  is_confirming?: boolean;
  /**
   * Callback invoked when the exporting has finished
   * @param status Status indicating whether the export was successful
   * @param data The exported sketch data
   */
  on_export_end?: (
    status: "success" | "fail",
    data?: { alt: string; file: File }
  ) => void;
  /**
   * Callback invoked when the exporting has started
   */
  on_export_start?: () => void;
}
