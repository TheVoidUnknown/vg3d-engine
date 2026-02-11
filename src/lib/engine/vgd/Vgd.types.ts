import type { Easing } from "../core/easing/Easing.types";

export interface IVgdLevel {
  events: IVgdEvents;
  objects: IVgdLevelObject[];
  prefabs?: IVgdPrefab[];
  prefabObjects?: IVgdPrefabInstance[];
  prefab_objects?: IVgdPrefabInstance[]; // awesome
  themes?: IVgdTheme[];
}

export type IVgdEvents = IVgdKeyframe[][]; 

export interface IVgdPrefab {
  n: string;
  id: string;
  preview?: string;
  o: number;
  objs: IVgdLevelObject[];
}

export interface IVgdPrefabInstance {
  id: string;
  pid: string;
  t: number;
  // ed: 
  e?: [
    { ev?: number[]; },
    { ev?: number[]; },
    // {}  Left over from rotation?
    // [ {"ev": [ 0.0, 0.0 ]}, {"ev": [ 1.0, -1.0]}, {} ]
  ]
}

export interface IVgdLevelObject {
  id: string;
  pre_id?: string;
  pre_iid?: string;
  p_id?: string;

  ak_t?: number;
  ak_o?: number;
  ot?: number;

  n: string;
  text?: string;

  d?: number;
  st: number;
  o?: { x: number, y: number };

  s?: number;
  so?: number;

  e: [
    { k: IVgdKeyframe[] },
    { k: IVgdKeyframe[] },
    { k: IVgdKeyframe[] },
    { k: IVgdKeyframe[] }
  ]

  p_t?: string;
  p_o?: number[];
}

export interface IVgdTheme {
  name: string;
  id: string;
  pla: string[];
  obj: string[];
  fx: string[];
  bg: string[];
  base_bg: string;
  base_gui: string;
  base_gui_accent: string;
}

export interface IVgdKeyframe {
  t?: number;
  r?: number;
  ct?: Easing;
  ev: number[];
  er?: number[];
  evs?: string[];
}