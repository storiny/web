import {
  createRelativePositionFromJSON as create_relative_position_from_json,
  RelativePosition,
  relativePositionToJSON as relative_position_to_json
} from "yjs";

/**
 * Defines a range on text using relative positions that can be transformed
 * back to absolute positions. (https://docs.yjs.dev/api/relative-positions)
 */
export class YRange {
  /**
   * Ctor
   * @param yanchor
   * @param yhead
   */
  constructor(yanchor: RelativePosition, yhead: RelativePosition) {
    this.yanchor = yanchor;
    this.yhead = yhead;
  }

  static from_json(json: any): YRange {
    return new YRange(
      create_relative_position_from_json(json.yanchor),
      create_relative_position_from_json(json.yhead)
    );
  }

  /**
   * Yjs anchor
   */
  public readonly yanchor: RelativePosition;
  /**
   * Yjs head
   */
  public readonly yhead: RelativePosition;

  toJSON(): any {
    return {
      yanchor: relative_position_to_json(this.yanchor),
      yhead: relative_position_to_json(this.yhead)
    };
  }
}
