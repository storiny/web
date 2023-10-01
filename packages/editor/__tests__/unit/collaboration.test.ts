import {
  $createParagraphNode as $create_paragraph_node,
  $createRangeSelection as $create_range_selection,
  $createTextNode as $create_text_node,
  $getRoot as $get_root,
  $isTextNode as $is_text_node,
  $setSelection as $set_selection,
  LexicalNode,
  NodeSelection,
  ParagraphNode,
  RangeSelection,
  TextNode
} from "lexical";

import {
  Client,
  connect_clients,
  create_and_start_clients,
  create_test_connection,
  disconnect_clients,
  stop_clients,
  test_clients_for_equality,
  wait_for_react
} from "./client";

/**
 * Creates and inserts a paragraph node with the provided children
 * @param children Paragraph node children
 */
const $insert_paragraph = (...children: Array<string | LexicalNode>): void => {
  const root = $get_root();
  const paragraph = $create_paragraph_node();

  const nodes = children.map((child) =>
    typeof child === "string" ? $create_text_node(child) : child
  );

  paragraph.append(...nodes);
  root.append(paragraph);
};

/**
 * Creates a selection using the provided path data
 * @param anchor_path Anchor path
 * @param anchor_offset Anchor offset
 * @param focus_path Focus path
 * @param focus_offset Focus offset
 */
const $create_selection_by_path = ({
  anchor_path,
  anchor_offset,
  focus_path,
  focus_offset
}: {
  anchor_offset: number;
  anchor_path: Array<number>;
  focus_offset: number;
  focus_path: Array<number>;
}): NodeSelection | RangeSelection => {
  const selection = $create_range_selection();
  const root = $get_root();

  const anchor_node = anchor_path.reduce(
    (node, index) => node.getChildAtIndex(index)!,
    root
  );
  const focus_node = focus_path.reduce(
    (node, index) => node.getChildAtIndex(index)!,
    root
  );

  selection.anchor.set(
    anchor_node.getKey(),
    anchor_offset,
    $is_text_node(anchor_node) ? "text" : "element"
  );
  selection.focus.set(
    focus_node.getKey(),
    focus_offset,
    $is_text_node(focus_node) ? "text" : "element"
  );

  $set_selection(selection);

  return selection;
};

/**
 * Replaces a selection based on the provided path by the provided text
 * @param anchor_path Anchor path
 * @param anchor_offset Anchor offset
 * @param focus_path Focus path
 * @param focus_offset Focus offset
 * @param text Target text
 */
const $replace_text_by_path = ({
  anchor_path,
  anchor_offset,
  focus_path,
  focus_offset,
  text = ""
}: {
  anchor_offset: number;
  anchor_path: Array<number>;
  focus_offset: number;
  focus_path: Array<number>;
  text: string | null | undefined;
}): void => {
  $create_selection_by_path({
    anchor_offset,
    anchor_path,
    focus_offset,
    focus_path
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
  const expect_correct_initial_content = async (
    client1: Client,
    client2: Client
  ): Promise<void> => {
    // Should be empty, as the client has not yet updated
    expect(client1.get_html()).toEqual("");
    expect(client1.get_html()).toEqual(client2.get_html());

    // Wait for the clients to render the initial content
    await Promise.resolve().then();

    expect(client1.get_html()).toEqual("<p><br></p>");
    expect(client1.get_html()).toEqual(client2.get_html());
    expect(client1.get_doc_json()).toEqual(client2.get_doc_json());
  };

  /**
   * Initializes and returns two clients
   */
  const init_clients = async (): Promise<{
    cleanup: () => void;
    client1: Client;
    client2: Client;
  }> => {
    const connector = create_test_connection();
    const client1 = connector.create_client("1");
    const client2 = connector.create_client("2");

    client1.start(container);
    client2.start(container);

    await expect_correct_initial_content(client1, client2);

    const cleanup = (): void => {
      client1.stop();
      client2.stop();
    };

    return { client1, client2, cleanup };
  };

  it("collaborates basic text insertion between two clients", async () => {
    const { client1, client2, cleanup } = await init_clients();

    // Insert a text node on the first client
    await wait_for_react(() => {
      client1.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = $create_text_node("Hello world");
        paragraph?.append(text);
      });
    });

    expect(client1.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client1.get_html()).toEqual(client2.get_html());
    expect(client1.get_doc_json()).toEqual(client2.get_doc_json());

    // Insert a text node on the second client
    await wait_for_react(() => {
      client2.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = paragraph?.getFirstChild<TextNode>();
        text?.spliceText(6, 5, "storiny");
      });
    });

    expect(client2.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello storiny</span></p>'
    );
    expect(client1.get_html()).toEqual(client2.get_html());
    expect(client1.get_doc_json()).toEqual({
      root: "[object Object]Hello storiny"
    });
    expect(client1.get_doc_json()).toEqual(client2.get_doc_json());

    cleanup();
  });

  it("handles basic text insertion conflicts between two clients", async () => {
    const { client1, client2, cleanup } = await init_clients();

    client1.disconnect();

    // Insert a text node on the first client
    await wait_for_react(() => {
      client1.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = $create_text_node("Hello world");
        paragraph?.append(text);
      });
    });

    expect(client1.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client2.get_html()).toEqual("<p><br></p>");

    // Insert a text node on the second client
    await wait_for_react(() => {
      client2.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = $create_text_node("Hello world");
        paragraph?.append(text);
      });
    });

    expect(client2.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client1.get_html()).toEqual(client2.get_html());

    await wait_for_react(() => {
      client1.connect();
    });

    // Text content should be repeated, but there should only be a single node
    expect(client1.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello worldHello world</span></p>'
    );
    expect(client1.get_html()).toEqual(client2.get_html());
    expect(client1.get_doc_json()).toEqual({
      root: "[object Object]Hello worldHello world"
    });
    expect(client1.get_doc_json()).toEqual(client2.get_doc_json());

    client2.disconnect();

    await wait_for_react(() => {
      client1.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = paragraph?.getFirstChild<TextNode>();
        text?.spliceText(11, 11, "");
      });
    });

    expect(client1.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client2.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello worldHello world</span></p>'
    );

    await wait_for_react(() => {
      client2.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = paragraph?.getFirstChild<TextNode>();
        text?.spliceText(11, 11, "!");
      });
    });

    await wait_for_react(() => {
      client2.connect();
    });

    expect(client1.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world!</span></p>'
    );
    expect(client1.get_html()).toEqual(client2.get_html());
    expect(client1.get_doc_json()).toEqual({
      root: "[object Object]Hello world!"
    });
    expect(client1.get_doc_json()).toEqual(client2.get_doc_json());

    cleanup();
  });

  it("handles basic text deletion conflicts between two clients", async () => {
    const { client1, client2, cleanup } = await init_clients();

    // Insert a text node on the first client
    await wait_for_react(() => {
      client1.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        const text = $create_text_node("Hello world");
        paragraph?.append(text);
      });
    });

    expect(client1.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );
    expect(client1.get_html()).toEqual(client2.get_html());
    expect(client1.get_doc_json()).toEqual({
      root: "[object Object]Hello world"
    });
    expect(client1.get_doc_json()).toEqual(client2.get_doc_json());

    client1.disconnect();

    // Delete the text on the first client
    await wait_for_react(() => {
      client1.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        paragraph?.getFirstChild()?.remove();
      });
    });

    expect(client1.get_html()).toEqual("<p><br></p>");
    expect(client2.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello world</span></p>'
    );

    // Insert a text node on the second client
    await wait_for_react(() => {
      client2.update(() => {
        const root = $get_root();
        const paragraph = root.getFirstChild<ParagraphNode>();
        paragraph?.getFirstChild<TextNode>()?.spliceText(11, 0, "Hello world");
      });
    });

    expect(client1.get_html()).toEqual("<p><br></p>");
    expect(client2.get_html()).toEqual(
      '<p dir="ltr"><span data-lexical-text="true">Hello worldHello world</span></p>'
    );

    await wait_for_react(() => {
      client1.connect();
    });

    /**
     * TODO: We can probably handle these conflicts better by keeping a fallback map when
     *   we remove text without any adjacent text nodes. This would require major changes
     *   in `CollabElementNode.splice` and `CollabElementNode.apply_children_yjs_delta` to handle
     *   the existence of these fallback maps. For now though, if a user clears all the text
     *   nodes from an element and another user inserts some text into the same element at the
     *   same time, the deletion operation will take precedence on conflicts.
     */
    expect(client1.get_html()).toEqual("<p><br></p>");
    expect(client1.get_html()).toEqual(client2.get_html());
    expect(client1.get_doc_json()).toEqual({
      root: ""
    });
    expect(client1.get_doc_json()).toEqual(client2.get_doc_json());

    cleanup();
  });

  it("allows the passing of arbitrary awareness data", async () => {
    const connector = create_test_connection();
    const client1 = connector.create_client("1");
    const client2 = connector.create_client("2");

    const awareness_data1 = {
      foo: "foo",
      uuid: Math.floor(Math.random() * 10000)
    };
    const awareness_data2 = {
      bar: "bar",
      uuid: Math.floor(Math.random() * 10000)
    };

    client1.start(container, awareness_data1);
    client2.start(container, awareness_data2);

    await expect_correct_initial_content(client1, client2);

    expect(client1.awareness.getLocalState()?.awareness_data).toEqual(
      awareness_data1
    );
    expect(client2.awareness.getLocalState()?.awareness_data).toEqual(
      awareness_data2
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
            $replace_text_by_path({
              anchor_offset: 5,
              anchor_path: [0, 0],
              focus_offset: 6,
              focus_path: [1, 0],
              text: ""
            });
          },
          (): void => {
            // Second client deletes the first paragraph
            $get_root().getFirstChild()?.remove();
          }
        ],
        expected_html: null,
        init: (): void => {
          $insert_paragraph("Hello world 1");
          $insert_paragraph("Hello world 2");
          $insert_paragraph("Hello world 3");
        },
        name: "handles removing text at within the first of multiple paragraphs colliding with removing first paragraph"
      },
      {
        clients: [
          (): void => {
            // First client deletes first two paragraphs
            const paragraphs = $get_root().getChildren();
            paragraphs[0].remove();
            paragraphs[1].remove();
          },
          (): void => {
            // Second client deletes the first paragraph
            $get_root().getFirstChild()?.remove();
          }
        ],
        expected_html: null,
        init: (): void => {
          $insert_paragraph("Hello world 1");
          $insert_paragraph("Hello world 2");
          $insert_paragraph("Hello world 3");
        },
        name: "handles removing first two paragraphs colliding with removing first paragraph"
      },
      {
        clients: [
          (): void => {
            $replace_text_by_path({
              anchor_offset: 0,
              anchor_path: [0, 0],
              focus_offset: 7,
              focus_path: [1, 0],
              text: "Hello client 1"
            });
          },
          (): void => {
            $replace_text_by_path({
              anchor_offset: 5,
              anchor_path: [1, 0],
              focus_offset: 5,
              focus_path: [2, 0],
              text: "Hello client 2"
            });
          }
        ],
        expected_html: null,
        init: (): void => {
          $insert_paragraph("Hello world 1");
          $insert_paragraph("Hello world 2");
          $insert_paragraph("Hello world 3");
        },
        name: "handles first and second paragraphs colliding with second and third paragraphs (being edited with overlapping edit)"
      }
    ] as Array<{
      clients: Array<() => void>;
      expected_html: string | null | undefined;
      init: () => void;
      name: string;
    }>
  ).forEach((test_case) => {
    it(test_case.name, async () => {
      const connection = create_test_connection();
      const clients = create_and_start_clients(
        connection,
        container,
        test_case.clients.length
      );

      // Set the initial content (into first editor only, the rest will be synced)
      const client1 = clients[0];

      await wait_for_react(() => {
        client1.update(() => {
          $get_root().clear();
          test_case.init();
        });
      });

      test_clients_for_equality(clients);

      // Disconnect clients and apply client-specific actions, reconnect them back, and
      // verify that they are synced and have the same content
      disconnect_clients(clients);

      for (let i = 0; i < clients.length; i++) {
        await wait_for_react(() => {
          clients[i].update(test_case.clients[i]);
        });
      }

      await wait_for_react(() => {
        connect_clients(clients);
      });

      if (test_case.expected_html) {
        expect(client1.get_html()).toEqual(test_case.expected_html);
      }

      test_clients_for_equality(clients);
      stop_clients(clients);
    });
  });
});
