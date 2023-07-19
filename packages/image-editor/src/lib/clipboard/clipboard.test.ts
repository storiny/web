import { parseClipboard } from "./clipboard";

describe("parseClipboard", () => {
  it("parses valid json correctly", async () => {
    let text = "123";
    let clipboardData = await parseClipboard({
      //@ts-ignore
      clipboardData: {
        getData: () => text
      }
    });

    expect(clipboardData.text).toEqual(text);
    text = "[123]";

    clipboardData = await parseClipboard({
      //@ts-ignore
      clipboardData: {
        getData: () => text
      }
    });

    expect(clipboardData.text).toEqual(text);
  });
});
