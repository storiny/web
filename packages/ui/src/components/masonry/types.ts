export type Position = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export type NodeData<T> = {
  heights: Array<number>;
  id: "start" | T;
  positions: Array<{ item: T; position: Position }>;
};

export interface Cache<K, V> {
  get(key: K): V | null | undefined;
  has(key: K): boolean;
  reset(): void;
  set(key: K, value: V): void;
}
