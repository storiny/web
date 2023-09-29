/* eslint-disable capitalized-comments */

// import { download_as_file } from "@storiny/shared/src/utils/download_as_file";
import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
// import { deflateSync } from "fflate";
import React from "react";

// import { applyUpdateV2, Doc, encodeStateAsUpdateV2 } from "yjs";
import MenubarItem from "../../../../../../../ui/src/components/menubar-item";
import MenubarSub from "../../../../../../../ui/src/components/menubar-sub";
import Separator from "../../../../../../../ui/src/components/separator";

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
// import { use_collaboration_context } from "../../../../../plugins/collaboration/context";

// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
const FileItem = (): React.ReactElement => {
  // const [exporting, setExporting] = React.useState<boolean>(false);
  // const { yjs_doc_map } = use_collaboration_context({});
  //
  // TODO: Implement
  // const save = async (): Promise<void> => {
  //   setExporting(true);
  //   try {
  //     const doc = yjs_doc_map.get("main");
  //
  //     if (doc) {
  //       const exportDoc = new Doc();
  //       applyUpdateV2(exportDoc, encodeStateAsUpdateV2(doc));
  //       const exportData = encodeStateAsUpdateV2(exportDoc);
  //       const compressedData = deflateSync(exportData, { level: 9 });
  //       download_as_file(
  //         new Blob([compressedData]),
  //         `export.sto`,
  //         "application/gzip"
  //       );
  //     }
  //   } finally {
  //     setExporting(false);
  //   }
  // };

  return (
    <MenubarSub
      slot_props={{
        trigger: { disabled: true }
      }}
      trigger={"File"}
    >
      <MenubarItem
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.import_file)}
      >
        Open…
      </MenubarItem>
      <MenubarItem>Save local copy…</MenubarItem>
      <Separator />
      <MenubarItem>Show version history</MenubarItem>
    </MenubarSub>
  );
};

export default FileItem;
