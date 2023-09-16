import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $isTextNode,
  $setSelection,
  LexicalNode,
  NodeSelection,
  ParagraphNode,
  RangeSelection,
  TextNode
} from "lexical";

import {
  Client,
  connectClients,
  createAndStartClients,
  createTestConnection,
  disconnectClients,
  stopClients,
  testClientsForEquality,
  waitForReact
} from "../utils/unit";

/**
 * Creates and inserts a paragraph node with the provided children
 * @param children Paragraph node children
 */
const $insertParagraph = (...children: Array<string | LexicalNode>): void => {
  const root = $getRoot();
  const paragraph = $createParagraphNode();

  const nodes = children.map((child) =>
    typeof child === "string" ? $createTextNode(child) : child
  );

  paragraph.append(...nodes);
  root.append(paragraph);
};

/**
 * Creates a selection using the provided path data
 * @param anchorPath Anchor path
 * @param anchorOffset Anchor offset
 * @param focusPath Focus path
 * @param focusOffset Focus offset
 */
const $createSelectionByPath = ({
  anchorPath,
  anchorOffset,
  focusPath,
  focusOffset
}: {
  anchorOffset: number;
  anchorPath: Array<number>;
  focusOffset: number;
  focusPath: Array<number>;
}): NodeSelection | RangeSelection => {
  const selection = $createRangeSelection();
  const root = $getRoot();

  const anchorNode = anchorPath.reduce(
    (node, index) => node.getChildAtIndex(index)!,
    root
  );
  const focusNode = focusPath.reduce(
    (node, index) => node.getChildAtIndex(index)!,
    root
  );

  selection.anchor.set(
    anchorNode.getKey(),
    anchorOffset,
    $isTextNode(anchorNode) ? "text" : "element"
  );
  selection.focus.set(
    focusNode.getKey(),
    focusOffset,
    $isTextNode(focusNode) ? "text" : "element"
  );

  $setSelection(selection);

  return selection;
};

/**
 * Replaces a selection based on the provided path by the provided text
 * @param anchorPath Anchor path
 * @param anchorOffset Anchor offset
 * @param focusPath Focus path
 * @param focusOffset Focus offset
 * @param text Target text
 */
const $replaceTextByPath = ({
  anchorPath,
  anchorOffset,
  focusPath,
  focusOffset,
  text = ""
}: {
  anchorOffset: number;
  anchorPath: Array<number>;
  focusOffset: number;
  focusPath: Array<number>;
  text: string | null | undefined;
}): void => {
  $createSelectionByPath({
    anchorOffset,
    anchorPath,
    focusOffset,
    focusPath
  }).insertText(text || "");
};

describe("collaboration", () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  /**
   * Asserts initial content of the clients
   * @param client1 First client
   * @param client2 Second client
   */
  const expectCorrectInitialContent = async (
    client1: Client,
    client2: Client
  ): Promise<void> => {
    // Should be empty, as the client has not yet updated
    expect(client1.getHTML()).toEqual("");
    expect(client1.getHTML()).toEqual(client2.getHTML());

    // Wait for the clients to render the initial content
    await Promise.resolve().then();

    expect(client1.getHTML()).toEqual("<p><br></p>");
    expect(client1.getHTML()).toEqual(client2.getHTML());
    expect(client1.getDocJSON()).toEqual(client2.getDocJSON());
  };

  /**
   * Initializes and returns two clients
   */
  const initClients = async (): Promise<{
    cleanup: () => void;
    client1: Client;
    client2: Client;
  }> => {
    const connector = createTestConnection();
    const client1 = connector.createClient("1");
    const client2 = connector.createClient("2");

    client1.start(container);
    client2.start(container);

    await expectCorrectInitialContent(client1, client2);

    const cleanup = (): void => {
      client1.stop();
      client2.stop();
    };

    return { client1, client2, cleanup };
  };

  it("collaborates basic text insertion between two clients", async () => {
    const { client1, client2, cleanup } = await initClients();

    // Insert a text node on the first client
    await waitForReact(() => {
      client1.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = $createTextNode("Hello world");
        paragraph?.append(text);
      });
    });

    expect(client1.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client1.getHTML()).toEqual(client2.getHTML());
    expect(client1.getDocJSON()).toEqual(client2.getDocJSON());

    // Insert a text node on the second client
    await waitForReact(() => {
      client2.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = paragraph?.getFirstChild<TextNode>();
        text?.spliceText(6, 5, "storiny");
      });
    });

    expect(client2.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello storiny</span></p>'
    );
    expect(client1.getHTML()).toEqual(client2.getHTML());
    expect(client1.getDocJSON()).toEqual({
      root: "[object Object]Hello storiny"
    });
    expect(client1.getDocJSON()).toEqual(client2.getDocJSON());

    cleanup();
  });

  it("handles basic text insertion conflicts between two clients", async () => {
    const { client1, client2, cleanup } = await initClients();

    client1.disconnect();

    // Insert a text node on the first client
    await waitForReact(() => {
      client1.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = $createTextNode("Hello world");
        paragraph?.append(text);
      });
    });

    expect(client1.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client2.getHTML()).toEqual("<p><br></p>");

    // Insert a text node on the second client
    await waitForReact(() => {
      client2.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = $createTextNode("Hello world");
        paragraph?.append(text);
      });
    });

    expect(client2.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client1.getHTML()).toEqual(client2.getHTML());

    await waitForReact(() => {
      client1.connect();
    });

    // Text content should be repeated, but there should only be a single node
    expect(client1.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello worldHello world</span></p>'
    );
    expect(client1.getHTML()).toEqual(client2.getHTML());
    expect(client1.getDocJSON()).toEqual({
      root: "[object Object]Hello worldHello world"
    });
    expect(client1.getDocJSON()).toEqual(client2.getDocJSON());

    client2.disconnect();

    await waitForReact(() => {
      client1.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = paragraph?.getFirstChild<TextNode>();
        text?.spliceText(11, 11, "");
      });
    });

    expect(client1.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client2.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello worldHello world</span></p>'
    );

    await waitForReact(() => {
      client2.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = paragraph?.getFirstChild<TextNode>();
        text?.spliceText(11, 11, "!");
      });
    });

    await waitForReact(() => {
      client2.connect();
    });

    expect(client1.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world!</span></p>'
    );
    expect(client1.getHTML()).toEqual(client2.getHTML());
    expect(client1.getDocJSON()).toEqual({
      root: "[object Object]Hello world!"
    });
    expect(client1.getDocJSON()).toEqual(client2.getDocJSON());

    cleanup();
  });

  it("handles basic text deletion conflicts between two clients", async () => {
    const { client1, client2, cleanup } = await initClients();

    // Insert a text node on the first client
    await waitForReact(() => {
      client1.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = $createTextNode("Hello world");
        paragraph?.append(text);
      });
    });

    expect(client1.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client1.getHTML()).toEqual(client2.getHTML());
    expect(client1.getDocJSON()).toEqual({
      root: "[object Object]Hello world"
    });
    expect(client1.getDocJSON()).toEqual(client2.getDocJSON());

    client1.disconnect();

    // Delete the text on the first client
    await waitForReact(() => {
      client1.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        paragraph?.getFirstChild()?.remove();
      });
    });

    expect(client1.getHTML()).toEqual("<p><br></p>");
    expect(client2.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );

    // Insert a text node on the second client
    await waitForReact(() => {
      client2.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild<ParagraphNode>();
        paragraph?.getFirstChild<TextNode>()?.spliceText(11, 0, "Hello world");
      });
    });

    expect(client1.getHTML()).toEqual("<p><br></p>");
    expect(client2.getHTML()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello worldHello world</span></p>'
    );

    await waitForReact(() => {
      client1.connect();
    });

    /**
     * TODO: We can probably handle these conflicts better by keeping a fallback map when
     *   we remove text without any adjacent text nodes. This would require major changes
     *   in `CollabElementNode.splice` and `CollabElementNode.applyChildrenYjsDelta` to handle
     *   the existence of these fallback maps. For now though, if a user clears all the text
     *   nodes from an element and another user inserts some text into the same element at the
     *   same time, the deletion operation will take precedence on conflicts.
     */
    expect(client1.getHTML()).toEqual("<p><br></p>");
    expect(client1.getHTML()).toEqual(client2.getHTML());
    expect(client1.getDocJSON()).toEqual({
      root: ""
    });
    expect(client1.getDocJSON()).toEqual(client2.getDocJSON());

    cleanup();
  });

  it("allows the passing of arbitrary awareness data", async () => {
    const connector = createTestConnection();
    const client1 = connector.createClient("1");
    const client2 = connector.createClient("2");

    const awarenessData1 = {
      foo: "foo",
      uuid: Math.floor(Math.random() * 10000)
    };
    const awarenessData2 = {
      bar: "bar",
      uuid: Math.floor(Math.random() * 10000)
    };

    client1.start(container, awarenessData1);
    client2.start(container, awarenessData2);

    await expectCorrectInitialContent(client1, client2);

    expect(client1.awareness.getLocalState()?.awarenessData).toEqual(
      awarenessData1
    );
    expect(client2.awareness.getLocalState()?.awarenessData).toEqual(
      awarenessData2
    );

    client1.stop();
    client2.stop();
  });

  (
    [
      {
        clients: [
          (): void => {
            // First client deletes text from first and second paragraphs
            $replaceTextByPath({
              anchorOffset: 5,
              anchorPath: [0, 0],
              focusOffset: 6,
              focusPath: [1, 0],
              text: ""
            });
          },
          (): void => {
            // Second client deletes the first paragraph
            $getRoot().getFirstChild()?.remove();
          }
        ],
        expectedHTML: null,
        init: (): void => {
          $insertParagraph("Hello world 1");
          $insertParagraph("Hello world 2");
          $insertParagraph("Hello world 3");
        },
        name: "handles removing text at within the first of multiple paragraphs colliding with removing first paragraph"
      },
      {
        clients: [
          (): void => {
            // First client deletes first two paragraphs
            const paragraphs = $getRoot().getChildren();
            paragraphs[0].remove();
            paragraphs[1].remove();
          },
          (): void => {
            // Second client deletes the first paragraph
            $getRoot().getFirstChild()?.remove();
          }
        ],
        expectedHTML: null,
        init: (): void => {
          $insertParagraph("Hello world 1");
          $insertParagraph("Hello world 2");
          $insertParagraph("Hello world 3");
        },
        name: "handles removing first two paragraphs colliding with removing first paragraph"
      },
      {
        clients: [
          (): void => {
            $replaceTextByPath({
              anchorOffset: 0,
              anchorPath: [0, 0],
              focusOffset: 7,
              focusPath: [1, 0],
              text: "Hello client 1"
            });
          },
          (): void => {
            $replaceTextByPath({
              anchorOffset: 5,
              anchorPath: [1, 0],
              focusOffset: 5,
              focusPath: [2, 0],
              text: "Hello client 2"
            });
          }
        ],
        expectedHTML: null,
        init: (): void => {
          $insertParagraph("Hello world 1");
          $insertParagraph("Hello world 2");
          $insertParagraph("Hello world 3");
        },
        name: "handles first and second paragraphs colliding with second and third paragraphs (being edited with overlapping edit)"
      }
    ] as Array<{
      clients: Array<() => void>;
      expectedHTML: string | null | undefined;
      init: () => void;
      name: string;
    }>
  ).forEach((testCase) => {
    it(testCase.name, async () => {
      const connection = createTestConnection();
      const clients = createAndStartClients(
        connection,
        container,
        testCase.clients.length
      );

      // Set the initial content (into first editor only, the rest will be synced)
      const client1 = clients[0];

      await waitForReact(() => {
        client1.update(() => {
          $getRoot().clear();
          testCase.init();
        });
      });

      testClientsForEquality(clients);

      // Disconnect clients and apply client-specific actions, reconnect them back, and
      // verify that they are synced and have the same content
      disconnectClients(clients);

      for (let i = 0; i < clients.length; i++) {
        await waitForReact(() => {
          clients[i].update(testCase.clients[i]);
        });
      }

      await waitForReact(() => {
        connectClients(clients);
      });

      if (testCase.expectedHTML) {
        expect(client1.getHTML()).toEqual(testCase.expectedHTML);
      }

      testClientsForEquality(clients);
      stopClients(clients);
    });
  });
});
