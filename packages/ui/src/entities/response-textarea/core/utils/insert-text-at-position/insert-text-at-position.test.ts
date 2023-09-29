import { insert_text_at_position } from "./insert-text-at-position";

describe("insert_text_at_position", () => {
  it("inserts text at the selection position", () => {
    const textarea = document.createElement("textarea");
    textarea.value = "initial text";
    textarea.setSelectionRange(0, 7);

    insert_text_at_position(textarea, "test");

    expect(textarea.value).toEqual("test text");
  });
});
