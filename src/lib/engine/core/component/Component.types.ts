import type Animation3DComponent from "./Animation3DComponent";
import type Animation2DComponent from "./Animation2DComponent";
import type { IAnimation3DComponent } from "./Animation3DComponent";
import type { IAnimation2DComponent } from "./Animation2DComponent";
import type { IAnimationComponent } from "./AnimationComponent";
import type AnimationComponent from "./AnimationComponent";

export interface IComponentStatic {
  type: string;
}

export interface IComponent<T, D extends IComponentStatic> {
  _isDirty?: boolean;

  type: () => string;
  init: (owner: Animatable) => void;
  update: (dt: number) => void;
  from?: (data: D) => T;
  serialize: () => D;
}

export type IComponentType = 
  IAnimationComponent
  | IAnimation3DComponent
  | IAnimation2DComponent

export type ComponentType = 
  AnimationComponent
  | Animation3DComponent
  | Animation2DComponent