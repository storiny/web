export interface ExportImageModalProps {
  /**
   * Boolean flag indicating whether the sketch is being confirmed
   */
  isConfirming?: boolean;
  /**
   * Callback invoked when the exporting has finished
   * @param status Status indicating whether the export was successful
   * @param data The exported sketch data
   */
  onExportEnd?: (
    status: "success" | "fail",
    data?: { alt: string; file: File }
  ) => void;
  /**
   * Callback invoked when the exporting has started
   */
  onExportStart?: () => void;
}
