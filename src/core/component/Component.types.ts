import type Component from "./Component";

// The shape of serialized data
export interface IComponentData {
  type: string;
  [key: string]: unknown;
}

// The required properties in the constructor
export interface IComponentStatic<T extends Component<D>, D extends IComponentData> {
  new (...args: any[]): T;
  TYPE: string;
  type(): string;
  from(data: D): T;
}