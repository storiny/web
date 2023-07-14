export const isDarwin = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
export const isWindows = /^Win/.test(navigator.platform);
export const isAndroid = /\b(android)\b/i.test(navigator.userAgent);
export const isFirefox =
  "netscape" in window &&
  navigator.userAgent.indexOf("rv:") > 1 &&
  navigator.userAgent.indexOf("Gecko") > 1;
export const isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
export const isSafari =
  !isChrome && navigator.userAgent.indexOf("Safari") !== -1;

// For mocking in tests
export const isBrave = (): boolean =>
  (navigator as any).brave?.isBrave?.name === "isBrave";
