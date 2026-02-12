import type { Easing } from "../easing/Easing.types";

export enum ObjectKeyframe {
  Move = "move",
  Scale = "scale",
  Rotation = "rotation",
  Color = "color"
}

export enum EventKeyframe {
  CameraMove = "cameraMove",
  CameraTarget = "cameraTarget",
  CameraFOV = "cameraFov",

  Theme = "theme",
  LightSourceMove = "lightSourceMove",
  LightSourceLuminosity = "lightSourceLuminosity",

  AmbientLight = "ambientLight"
}

export type KeyframeType = keyof typeof ObjectKeyframe | keyof typeof EventKeyframe;

export enum Randomize {
  None = 0,
  Linear = 1,
  Toggle = 2,
  Relative = 3
}

export interface IKeyframe {
  randomSeed?: number;

  time: number;
  easing?: Easing;
  data: number[];
  random?: number[];
  themeId?: string;
  randomize?: number;
  randomizeInterval?: number;
}