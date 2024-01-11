// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import { appleStock as apple_stock } from "@visx/mock-data";

import AreaChart from "./area-chart";

const meta: Meta<typeof AreaChart> = {
  title: "entities/area-chart",
  component: AreaChart,
  args: {
    data: apple_stock.slice(0, 90).map((stock) => ({
      value: stock.close,
      date: stock.date
    })),
    label: "Label",
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    style: { width: 640, minHeight: 300 }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AreaChart>;

export const Default: Story = {};
