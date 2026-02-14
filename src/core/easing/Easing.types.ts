import { EaseFunctions } from "./Easing.const";

export type EaseFunction = (t: number) => number;
export type Easing = keyof typeof EaseFunctions;