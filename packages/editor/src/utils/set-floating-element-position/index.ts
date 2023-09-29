import styles from "../../plugins/common/floating-element.module.scss";

const VERTICAL_GAP = 10; // Vertical offset from anchor
const TOP_OFFSET = 70; // Offset till the popover gets flipped vertically (in px)

/**
 * Sets the position of floating popover element relative to the text selection
 * @param floating_element Floating popover element
 * @param root_element Editor root element
 */
export const set_floating_element_position = (
  floating_element: HTMLElement,
  root_element: HTMLElement | null
): void => {
  const selection_range = window.getSelection()?.getRangeAt(0);
  const selection_rect = selection_range?.getBoundingClientRect();
  const floating_element_rect = floating_element.getBoundingClientRect();
  const body_rect = document.body.getBoundingClientRect();
  const root_rect = root_element?.getBoundingClientRect();
  let flipped = false;

  if (!selection_rect || !root_rect) {
    floating_element.style.visibility = "hidden";
    return;
  }

  let top = selection_rect.top - floating_element_rect.height - VERTICAL_GAP;
  let left =
    selection_rect.left +
    selection_rect.width / 2 -
    floating_element_rect.width / 2;

  if (top < TOP_OFFSET) {
    flipped = true;
    top +=
      floating_element_rect.height + selection_rect.height + VERTICAL_GAP * 2;
  }

  if (left + floating_element_rect.width > root_rect.right) {
    left = root_rect.right - floating_element_rect.width - 8;
  } else if (left < floating_element_rect.width / 2) {
    left = root_rect.left + 8;
  }

  top -= body_rect.top;

  floating_element.classList.toggle(styles.flipped, flipped);
  floating_element.style.visibility = "visible";
  floating_element.style.transform = `translate3d(${left}px, ${top}px, 0)`;
};
