import styles from "../../plugins/common/floating-element.module.scss";

const VERTICAL_GAP = 10; // Vertical offset from anchor
const TOP_OFFSET = 70; // Offset till the popover gets flipped vertically (in px)

/**
 * Sets the position of floating popover element relative to the text selection
 * @param floatingElement Floating popover element
 * @param rootElement Editor root element
 */
export const setFloatingElementPosition = (
  floatingElement: HTMLElement,
  rootElement: HTMLElement | null
): void => {
  const selectionRange = window.getSelection()?.getRangeAt(0);
  const selectionRect = selectionRange?.getBoundingClientRect();
  const floatingElementRect = floatingElement.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const rootRect = rootElement?.getBoundingClientRect();
  let flipped: boolean = false;

  if (!selectionRect || !rootRect) {
    floatingElement.style.visibility = "hidden";
    return;
  }

  let top = selectionRect.top - floatingElementRect.height - VERTICAL_GAP;
  let left =
    selectionRect.left +
    selectionRect.width / 2 -
    floatingElementRect.width / 2;

  if (top < TOP_OFFSET) {
    flipped = true;
    top += floatingElementRect.height + selectionRect.height + VERTICAL_GAP * 2;
  }

  if (left + floatingElementRect.width > rootRect.right) {
    left = rootRect.right - floatingElementRect.width - 8;
  } else if (left < floatingElementRect.width / 2) {
    left = rootRect.left + 8;
  }

  top -= bodyRect.top;

  floatingElement.classList.toggle(styles.flipped, flipped);
  floatingElement.style.visibility = "visible";
  floatingElement.style.transform = `translate3d(${left}px, ${top}px, 0)`;
};
