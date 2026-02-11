import type { IComponent, IComponentStatic } from "../component/Component.types";

export interface IComponentConstructor<T extends IComponent<T, D>, D extends IComponentStatic> {
  new (initial?: Partial<D>): T;
  from(data: D): T;
}