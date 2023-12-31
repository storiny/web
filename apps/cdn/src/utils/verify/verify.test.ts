import { decode_hex } from "../decode-hex";
import { verify } from "./verify";

const KEY = "defa4761d7619e15601ebfcae50d82083082c5eb17759a5251a58f0076a98605";
const DIGEST = "4ce277959cc5195b91125c42ebfa4ca4672148e6";
const DECODED_URL =
  decode_hex(
    "68747470733a2f2f73746f72696e792e636f6d2f6578616d706c652e6a7067"
  ) || "";

describe("verify", () => {
  it("returns `true` for a valid remote image url", () => {
    expect(verify(DIGEST, DECODED_URL, KEY)).toBeTrue();
  });

  it("returns `false` for an invalid remote image url", () => {
    expect(verify(DIGEST, DECODED_URL + "invalid", KEY)).toBeFalse();
  });
});
