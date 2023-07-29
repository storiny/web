/**
 * Waits for an element to get appended to the document
 * @param selector Element selector
 */
export const waitForElement = (
  selector: string
): Promise<HTMLElement | Element | null> =>
  new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
