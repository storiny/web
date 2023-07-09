export class MeasurementStore<T extends {} | unknown[], V> {
  map: WeakMap<T, V> = new WeakMap();

  /**
   * Returns a measurement by key
   * @param key Measurement key
   */
  get(key: T): V | null | undefined {
    return this.map.get(key);
  }

  /**
   * Checks if the store holds a measurement value against the specified key
   * @param key Measurement key
   */
  has(key: T): boolean {
    return this.map.has(key);
  }

  /**
   * Sets a new measurement value to the store
   * @param key Measurement key
   * @param value Measurement value
   */
  set(key: T, value: V): void {
    this.map.set(key, value);
  }

  /**
   * Resets all the measurements in the store
   */
  reset(): void {
    this.map = new WeakMap();
  }
}
