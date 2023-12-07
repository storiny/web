import { sanitize_authentication_code } from "./sanitize-authentication-code";

describe("sanitize_authentication_code", () => {
  it("sanitizes an authentication code", () => {
    expect(sanitize_authentication_code("000abcd")).toEqual("000abcd");
    expect(sanitize_authentication_code("000 000")).toEqual("0".repeat(6));
    expect(sanitize_authentication_code("000-abcd_0%1")).toEqual("000abcd01");
    expect(sanitize_authentication_code("xxxx-xxxx-xxxx")).toEqual(
      "x".repeat(12)
    );
  });
});
