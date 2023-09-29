export class HeightStore {
  heights: number[] = [];

  /**
   * Gets all the heights in the store
   */
  get_heights(): number[] {
    return this.heights;
  }

  /**
   * Overwrites all the heights in the store
   * @param next_heights New heights
   */
  set_heights(next_heights: number[]): void {
    this.heights = next_heights;
  }

  /**
   * Resets all the heights in the store
   */
  reset(): void {
    this.heights = [];
  }
}
