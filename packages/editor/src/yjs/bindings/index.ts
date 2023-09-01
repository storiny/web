import { Klass, LexicalEditor, LexicalNode, NodeKey } from "lexical";
import { Doc, XmlText } from "yjs";

import { Provider } from ".";
import type { CollabDecoratorNode } from "./CollabDecoratorNode";
import type { CollabElementNode } from "./CollabElementNode";
import { $createCollabElementNode } from "./CollabElementNode";
import type { CollabLineBreakNode } from "./CollabLineBreakNode";
import type { CollabTextNode } from "./CollabTextNode";
import type { Cursor } from "./SyncCursors";

export type ClientID = number;
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
  id: string;
  nodeProperties: Map<string, Array<string>>;
  root: CollabElementNode;
}
export type ExcludedProperties = Map<Klass<LexicalNode>, Set<string>>;

export const createBinding = (
  editor: LexicalEditor,
  provider: Provider,
  id: string,
  doc: Doc | null | undefined,
  docMap: Map<string, Doc>,
  excludedProperties?: ExcludedProperties
): Binding => {
  invariant(
    doc !== undefined && doc !== null,
    "createBinding: doc is null or undefined"
  );
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
    id,
    nodeProperties: new Map(),
    root
  };
};
