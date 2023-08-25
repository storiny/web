import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import { useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Spacer from "~/components/Spacer";

import { documentLoadingAtom } from "../../atoms";
import EditorLayout from "../layout";
import EditorLoader from "../loader";

const EditorShortcuts = dynamic(() => import("../../shortcuts"));
const EditorBody = dynamic(() => import("../body"), {
  loading: dynamicLoader(() => <EditorLoader />)
});

const Editor = (): React.ReactElement => {
  const setDocumentLoading = useSetAtom(documentLoadingAtom);

  React.useEffect(() => {
    setDocumentLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EditorLayout>
      <EditorBody />
      <Spacer className={"f-grow"} orientation={"vertical"} size={10} />
      <EditorShortcuts />
    </EditorLayout>
  );
};

export default Editor;
