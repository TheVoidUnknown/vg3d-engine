import type { Easing } from "../easing/Easing.types";
import type { IKeyframe } from "./Keyframe.types";

const DEFAULT: IKeyframe = {
  time: 0,
  easing: "Linear" as Easing,
  data: []
}

export default class Keyframe implements IKeyframe {
  public time!: number;
  public easing!: Easing;
  public data!: number[];
  public random?: number[];
  public themeId?: string;
  public randomize?: number;
  public randomizeInterval?: number;

  public randomSeed!: number;

  constructor(initial?: Partial<IKeyframe>) { 
    this.refreshSeed();

    if (initial) {
      this.assign(initial);
    } else {
      this.assign(structuredClone(DEFAULT));
    }
  }

  public static from(
    data: Partial<IKeyframe>
  ): Keyframe {
    return new Keyframe(data);
  }

  public serialize(): IKeyframe { 
    return {
      time: this.time,
      easing: this.easing,
      data: structuredClone(this.data),
      random: this.random,
      themeId: this.themeId,
      randomize: this.randomize,
      randomizeInterval: this.randomizeInterval
    };
  }

  public assign(
    data: Partial<IKeyframe>
  ): this { 
    this.data = structuredClone(data.data) ?? this.data ?? [];

    this.time = data.time ?? 0;
    this.easing = data.easing ?? "Linear";
    this.random = data.random;
    this.themeId = data.themeId;
    this.randomize = data.randomize;
    this.randomizeInterval = data.randomizeInterval;

    return this;
  }
  
  public refreshSeed() { this.randomSeed = Math.floor(Math.random() * 999999); }
  public setTime(t: number): this     { this.time = t;     return this; }
  public setEasing(ct: Easing): this  { this.easing = ct;  return this; }
  public setData(val: number[]): this { this.data = val;   return this; }
  public setThemeId(id: string): this { this.themeId = id; return this; }
}