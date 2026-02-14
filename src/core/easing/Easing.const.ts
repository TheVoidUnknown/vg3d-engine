import type { EaseFunction, Easing } from "./Easing.types";

const Pi = Math.PI;
const Pi2 = Pi / 2.0;
const B1 = 1.0 / 2.75;
const B2 = 2.0 / 2.75;
const B3 = 1.5 / 2.75;
const B4 = 2.5 / 2.75;
const B5 = 2.25 / 2.75;
const B6 = 2.625 / 2.75;

export const getEasing = (name?: Easing): EaseFunction => {
  return EaseFunctions[name || "Linear" as Easing] || EaseFunctions.Linear;
}

export const EaseFunctions = {
  Linear: (t: number) => t,
  Instant: () => 0,
  
  InSine: (t: number) => (t === 1 ? 1 : -Math.cos(Pi2 * t) + 1),
  OutSine: (t: number) => Math.sin(Pi2 * t),
  InOutSine: (t: number) => -Math.cos(Pi * t) / 2 + 0.5,
  
  InElastic: (t: number) => Math.sin(13 * Pi2 * t) * Math.pow(2, 10 * (t - 1)),
  OutElastic: (t: number) => (t === 1 ? 1 : (Math.sin(-13 * Pi2 * (t + 1)) * Math.pow(2, -10 * t) + 1)),
  InOutElastic: (t: number) => {
    if (t < 0.5) {
        return 0.5 * Math.sin(13 * Pi2 * (2 * t)) * Math.pow(2, 10 * ((2 * t) - 1));
    }
    return 0.5 * (Math.sin(-13 * Pi2 * ((2 * t - 1) + 1)) * Math.pow(2, -10 * (2 * t - 1)) + 2);
  },
  
  InBack: (t: number) => t * t * (2.70158 * t - 1.70158),
  OutBack: (t: number) => 1 - (--t * t * (-2.70158 * t - 1.70158)),
  InOutBack: (t: number) => {
    const s = 1.70158;
    const s1 = s * 1.525;
    t *= 2;
    if (t < 1) { return 0.5 * (t * t * ((s1 + 1) * t - s1)); }
    t -= 2;
    return 0.5 * (t * t * ((s1 + 1) * t + s1) + 2);
  },
  
  InBounce: (t: number) => {
    t = 1 - t;
    if (t < B1) return 1 - 7.5625 * t * t;
    if (t < B2) return 1 - (7.5625 * (t - B3) * (t - B3) + 0.75);
    if (t < B4) return 1 - (7.5625 * (t - B5) * (t - B5) + 0.9375);
    return 1 - (7.5625 * (t - B6) * (t - B6) + 0.984375);
  },
  OutBounce: (t: number) => {
    if (t < B1) return 7.5625 * t * t;
    if (t < B2) return 7.5625 * (t - B3) * (t - B3) + 0.75;
    if (t < B4) return 7.5625 * (t - B5) * (t - B5) + 0.9375;
    return 7.5625 * (t - B6) * (t - B6) + 0.984375;
  },
  InOutBounce: (t: number) => {
    if (t < 0.5) {
      t = 1 - t * 2;
      if (t < B1) return (1 - 7.5625 * t * t) / 2;
      if (t < B2) return (1 - (7.5625 * (t - B3) * (t - B3) + 0.75)) / 2;
      if (t < B4) return (1 - (7.5625 * (t - B5) * (t - B5) + 0.9375)) / 2;
      return (1 - (7.5625 * (t - B6) * (t - B6) + 0.984375)) / 2;
    }

    t = t * 2 - 1;
    if (t < B1) return (7.5625 * t * t) / 2 + 0.5;
    if (t < B2) return (7.5625 * (t - B3) * (t - B3) + 0.75) / 2 + 0.5;
    if (t < B4) return (7.5625 * (t - B5) * (t - B5) + 0.9375) / 2 + 0.5;
    return (7.5625 * (t - B6) * (t - B6) + 0.984375) / 2 + 0.5;
  },

  InQuad: (t: number) => t * t,
  OutQuad: (t: number) => -t * (t - 2),
  InOutQuad: (t: number) => (t <= 0.5 ? t * t * 2 : 1 - (--t) * t * 2),

  InCirc: (t: number) => -(Math.sqrt(1 - t * t) - 1),
  OutCirc: (t: number) => Math.sqrt(1 - (t - 1) * (t - 1)),
  InOutCirc: (t: number) => (t <= 0.5 ? (Math.sqrt(1 - t * t * 4) - 1) / -2 : (Math.sqrt(1 - (t * 2 - 2) * (t * 2 - 2)) + 1) / 2),

  InExpo: (t: number) => Math.pow(2, 10 * (t - 1)),
  OutExpo: (t: number) => (t === 1 ? 1 : (-Math.pow(2, -10 * t) + 1)),
  InOutExpo: (t: number) => (t === 1 ? 1 : (t < 0.5 ? Math.pow(2, 10 * (t * 2 - 1)) / 2 : (-Math.pow(2, -10 * (t * 2 - 1)) + 2) / 2)),
} as const;