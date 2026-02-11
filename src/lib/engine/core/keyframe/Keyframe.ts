import type { Easing } from "../easing/Easing.types";
import type { IKeyframe, RandomizerType } from "./Keyframe.types";

const DEFAULT: IKeyframe = {
  time: 0,
  easing: "Linear" as Easing,
  data: []
}

// TODO: Remove this class entirely, its so much worse than just using flat arrays
export default class Keyframe implements IKeyframe {
  time!: number;
  easing!: Easing;
  data!: number[];
  random?: number[];
  themeId?: string;
  randomize?: RandomizerType;

  randomSeed!: number;

  constructor(initial?: Partial<IKeyframe>) { 
    Object.assign(this, structuredClone(DEFAULT));
    this.refreshRandomSeed();

    if (initial) { this.assign(initial); }
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
    };
  }

  public assign(
    data: Partial<IKeyframe>
  ): this { 
    this.data = structuredClone(data.data) ?? this.data;
    this.easing = data.easing ?? "Linear";
    this.random = data.random;
    this.randomize = data.randomize;
    this.themeId = data.themeId;
    this.time = data.time ?? 0;

    return this;
  }
  
  public refreshRandomSeed() {
    this.randomSeed = Math.floor(Math.random() * 999999);
  }

  public setTime(t: number): this     { this.time = t;     return this; }
  public setEasing(ct: Easing): this  { this.easing = ct;  return this; }
  public setData(val: number[]): this { this.data = val;   return this; }
  public setThemeId(id: string): this { this.themeId = id; return this; }
}