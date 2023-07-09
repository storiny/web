export class HeightStore {
  heights: number[] = [];

  /**
   * Gets all the heights in the store
   */
  getHeights(): number[] {
    return this.heights;
  }

  /**
   * Overwrites all the heights in the store
   * @param newHeights New heights
   */
  setHeights(newHeights: number[]): void {
    this.heights = newHeights;
  }

  /**
   * Resets all the heights in the store
   */
  reset(): void {
    this.heights = [];
  }
}
