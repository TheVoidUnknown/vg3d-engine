/* eslint-disable @typescript-eslint/no-unused-vars */

import type { IComponentData, IComponentStatic } from "./Component.types";

// Every component must extend this class
export abstract class Component<D extends IComponentData> {
  public _isDirty = true;
  
  public abstract type(): string;
  public abstract serialize(): D;

  public init(owner: Animatable): void {}
  public update(dt: number): void {}
  
  public is<Other extends Component<any>>(
    Constructor: IComponentStatic<Other, any>
  ): this is Other {
    return this.type() === Constructor.TYPE;
  }
}