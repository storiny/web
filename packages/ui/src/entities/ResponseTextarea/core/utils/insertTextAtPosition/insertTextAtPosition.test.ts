import { insertTextAtPosition } from "./insertTextAtPosition";

describe("insertTextAtPosition", () => {
  it("inserts text at the selection position", () => {
    const textarea = document.createElement("textarea");
    textarea.value = "initial text";
    textarea.setSelectionRange(0, 7);

    insertTextAtPosition(textarea, "test");

    expect(textarea.value).toEqual("test text");
  });
});
