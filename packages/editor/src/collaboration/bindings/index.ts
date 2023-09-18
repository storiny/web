import { Klass, LexicalEditor, LexicalNode, NodeKey } from "lexical";
import { Doc, XmlText } from "yjs";

import { Cursor } from "../../utils/sync-cursor-positions";
import { CollabDecoratorNode } from "../nodes/decorator";
import { $createCollabElementNode, CollabElementNode } from "../nodes/element";
import { CollabLineBreakNode } from "../nodes/line-break";
import { CollabTextNode } from "../nodes/text";

export type ClientID = number;
export type ExcludedProperties = Map<Klass<LexicalNode>, Set<string>>;

export interface Binding {
  clientID: number;
  collabNodeMap: Map<
    NodeKey,
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode
  >;
  cursors: Map<ClientID, Cursor>;
  cursorsContainer: null | HTMLElement;
  doc: Doc;
  docMap: Map<string, Doc>;
  editor: LexicalEditor;
  excludedProperties: ExcludedProperties;
  nodeProperties: Map<string, Array<string>>;
  root: CollabElementNode;
}

/**
 * Creates yjs editor binding
 * @param editor Editor
 * @param doc Document
 * @param docMap Document map
 * @param excludedProperties Excluded properties
 */
export const createBinding = (
  editor: LexicalEditor,
  doc: Doc | null | undefined,
  docMap: Map<string, Doc>,
  excludedProperties?: ExcludedProperties
): Binding => {
  if (doc === undefined || doc === null) {
    throw new Error("`createBinding`: doc is null or undefined");
  }

  const rootXmlText = doc.get("root", XmlText) as XmlText;
  const root: CollabElementNode = $createCollabElementNode(
    rootXmlText,
    null,
    "root"
  );
  root._key = "root";

  return {
    clientID: doc.clientID,
    collabNodeMap: new Map(),
    cursors: new Map(),
    cursorsContainer: null,
    doc,
    docMap,
    editor,
    excludedProperties: excludedProperties || new Map(),
    nodeProperties: new Map(),
    root
  };
};
