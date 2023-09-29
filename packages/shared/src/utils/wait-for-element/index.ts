/**
 * Waits for an element to get appended to the document
 * @param selector Element selector
 */
export const wait_for_element = (
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
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      childList: true,
      subtree: true
    });
  });
