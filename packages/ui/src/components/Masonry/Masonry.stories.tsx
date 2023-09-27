// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Masonry from "./Masonry";
import { MasonryProps } from "./Masonry.props";

type Item = { index: number };

const getItems = (): Item[] => [...Array(250)].map((_, index) => ({ index }));

const MasonryImpl = ({
  items,
  renderItem,
  ...rest
}: MasonryProps<Item>): React.ReactElement => (
  <Masonry {...rest} items={items} renderItem={renderItem} />
);

const meta: Meta<typeof MasonryImpl> = {
  title: "Components/Masonry",
  component: MasonryImpl,
  tags: ["autodocs"],
  args: {
    items: getItems(),
    gutterWidth: 24,
    minCols: 3,
    slot_props: {
      container: { style: { maxHeight: "450px", overflow: "auto" } }
    },
    renderItem: ({ data }) => (
      <span
        className={"flex-center"}
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
