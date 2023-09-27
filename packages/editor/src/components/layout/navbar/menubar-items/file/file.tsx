// import { downloadAsFile } from "@storiny/shared/src/utils/downloadAsFile";
import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
// import { deflateSync } from "fflate";
import React from "react";

// import { applyUpdateV2, Doc, encodeStateAsUpdateV2 } from "yjs";
import MenubarItem from "~/components/MenubarItem";
import MenubarSub from "~/components/MenubarSub";
import Separator from "~/components/Separator";

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
// import { useCollaborationContext } from "../../../../../plugins/collaboration/context";

// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
const FileItem = (): React.ReactElement => {
  // const [exporting, setExporting] = React.useState<boolean>(false);
  // const { yjsDocMap } = useCollaborationContext({});
  //
  // TODO: Implement
  // const save = async (): Promise<void> => {
  //   setExporting(true);
  //   try {
  //     const doc = yjsDocMap.get("main");
  //
  //     if (doc) {
  //       const exportDoc = new Doc();
  //       applyUpdateV2(exportDoc, encodeStateAsUpdateV2(doc));
  //       const exportData = encodeStateAsUpdateV2(exportDoc);
  //       const compressedData = deflateSync(exportData, { level: 9 });
  //       downloadAsFile(
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
      <MenubarItem rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.importFile)}>
        Open…
      </MenubarItem>
      <MenubarItem>Save local copy…</MenubarItem>
      <Separator />
      <MenubarItem>Show version history</MenubarItem>
    </MenubarSub>
  );
};

export default FileItem;
