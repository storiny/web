// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Masonry from "./masonry";
import { MasonryProps } from "./masonry.props";

type Item = { index: number };

const get_items = (): Item[] => [...Array(250)].map((_, index) => ({ index }));

const MasonryImpl = ({
  items,
  render_item,
  ...rest
}: MasonryProps<Item>): React.ReactElement => (
  <Masonry {...rest} items={items} render_item={render_item} />
);

const meta: Meta<typeof MasonryImpl> = {
  title: "components/masonry",
  component: MasonryImpl,
  tags: ["autodocs"],
  args: {
    items: get_items(),
    gutter_width: 24,
    min_cols: 3,
    slot_props: {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      container: { style: { maxHeight: "450px", overflow: "auto" } }
    },
    render_item: ({ data }) => (
      <span
        className={css["flex-center"]}
        style={{
          display: "block",
          height: "256px",
          marginBlock: "12px",
          padding: "12px",
          textAlign: "center",
          border: "1px solid var(--divider)",
          backgroundColor: "var(--bg-elevation-md)"
        }}
      >
        <span>Item {data.index + 1}</span>
      </span>
    )
  }
};

export default meta;
type Story = StoryObj<typeof Masonry>;

export const Default: Story = {};
