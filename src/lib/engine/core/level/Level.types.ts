import type { IAnimatable } from "../animatable/Animatable.types";
import type { Rgba } from "../../services/ColorService";

export interface ILevelMetadata {
  id: string;
  displayName: string;
}

export interface ILevel {
  metadata: ILevelMetadata;
  objects: IAnimatable[];
  events: IAnimatable;
  themes: ITheme[];
}

export interface ITheme {
  id: string;
  name: string;
  effects: Rgba[];
  parallax: Rgba[];
  objects: Rgba[];
  background: Rgba;
  gui: Rgba;
  guiAccent: Rgba;
}