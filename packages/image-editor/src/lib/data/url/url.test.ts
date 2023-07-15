import { normalizeLink } from "./url";

describe("normalizeLink", () => {
  test("sanitizes links", () => {
    expect(
      normalizeLink(`javascript://%0aalert(document.domain)`).startsWith(
        `javascript:`
      )
    ).toEqual(false);

    expect(normalizeLink("test")).toEqual("test");
    expect(normalizeLink(" test")).toEqual("test");

    expect(normalizeLink("https://www.storiny.com")).toEqual(
      "https://www.storiny.com"
    );

    expect(normalizeLink("www.storiny.com")).toEqual("www.storiny.com");
    expect(normalizeLink("/test")).toEqual("/test");
    expect(normalizeLink("http://test")).toEqual("http://test");
    expect(normalizeLink("ftp://test")).toEqual("ftp://test");
    expect(normalizeLink("file://")).toEqual("file://");
    expect(normalizeLink("file://")).toEqual("file://");
    expect(normalizeLink("[test](https://test)")).toEqual(
      "[test](https://test)"
    );

    expect(normalizeLink("[[test]]")).toEqual("[[test]]");
    expect(normalizeLink("<test>")).toEqual("<test>");
  });
});
