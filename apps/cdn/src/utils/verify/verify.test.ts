import { decodeHex } from "../decodeHex";
import { verify } from "./verify";

const key = "defa4761d7619e15601ebfcae50d82083082c5eb17759a5251a58f0076a98605";
const digest = "4ce277959cc5195b91125c42ebfa4ca4672148e6";
const decodedUrl =
  decodeHex("68747470733a2f2f73746f72696e792e636f6d2f6578616d706c652e6a7067") ||
  "";

describe("verify", () => {
  test("returns `true` for a valid remote image url", () => {
    expect(verify(digest, decodedUrl, key)).toBeTruthy();
  });

  test("returns `false` for an invalid remote image url", () => {
    expect(verify(digest, decodedUrl + "invalid", key)).toBeFalsy();
  });
});
