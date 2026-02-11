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

export enum Randomizer {
  None = "none",
  Linear = "linear",
  Toggle = "toggle",
  Relative = "relative"
}

export type RandomizerType = keyof typeof Randomizer;

export interface IKeyframe {
  time: number;
  easing?: Easing;
  data: number[];
  random?: number[];
  themeId?: string;
  randomize?: RandomizerType;
}