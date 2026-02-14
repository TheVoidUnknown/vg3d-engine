// types
import type KeyframeTrack from "../core/keyframeTrack/KeyframeTrack";
import type Keyframe from "../core/keyframe/Keyframe";
import { Randomize, type KeyframeType } from "../core/keyframe/Keyframe.types";
import type { ComponentType } from "../core/component/Component.types";
import type { ITheme } from "../core/level/Level.types";
import type { RawRgb } from "./ColorService";

// utils
import { getEasing } from "../core/easing/Easing.const";
import ColorService from "./ColorService";

export type IParentSettings = {
  [K in KeyframeType]?: {
    enabled: boolean;
    offset: number;
  }
}

export type IAnimationParameters = {
  [K in KeyframeType]?: number[];
}

// TODO: Just make the standard ITheme class use RawRgb, there's no reason not to
interface CachedTheme {
  background: RawRgb;
  gui: RawRgb;
  guiAccent: RawRgb;
  effects: RawRgb[];
  parallax: RawRgb[];
  objects: RawRgb[];
}

const _themeCache = new Map<string, CachedTheme>();
const _scratchArrayVal: number[] = [];
const _scratchRandomPrev: number[] = [];
const _scratchRandomNext: number[] = [];

const _trackQueryResult = {
  prev: null as unknown as Keyframe,
  next: null as unknown as Keyframe,
  t: 0
};

export default class AnimationService {
  public static interpolateTracks(
    time: number,
    component: ComponentType,
    out: IAnimationParameters,
    parentSettings?: IParentSettings,
    isRootNode = true,
  ): IAnimationParameters {
    for (const k in component.tracks) {
      const key = k as KeyframeType; // thanks typescript
      const track = component.tracks[key];

      if (!track) { continue; }

      let enabled = true;
      let offset = 0;

      // Resolve parent settings
      if (parentSettings) {
        const setting = parentSettings[key];
        if (setting) {
          enabled = setting.enabled;
          offset = setting.offset;
        }
      }

      // Interpolate Track
      this.interpolateTrack(track, time - offset); // Mutates _trackQueryResult with binary tree search results
      const { prev, next, t } = _trackQueryResult;

      let prevData = prev.data;
      let nextData = next.data;

      // Handle Randomization
      if (prev.randomize) { prevData = this.getRandom(prev, _scratchRandomPrev); }
      if (next.randomize) { nextData = this.getRandom(next, _scratchRandomNext); }

      // Lerp result
      if (enabled || isRootNode) {
        let targetArr = out[key];

        if (!targetArr) {
          targetArr = new Array(prevData.length).fill(0);
          out[key] = targetArr;
        }

        this.lerpArrays(prevData, nextData, t, targetArr);
      }
    }

    return out;
  }

  public static interpolateTheme(
    time: number,
    themes: Map<string, ITheme>,
    track: KeyframeTrack
  ): ITheme {
    this.interpolateTrack(track, time);
    const { prev, next, t } = _trackQueryResult;

    const themeA = themes.get(prev.themeId ?? "");
    const themeB = themes.get(next.themeId ?? "");

    if (!themeA && !themeB) { throw new Error("Missing themes for interpolation"); }
    if (!themeA) { return themeB!; }
    if (!themeB) { return themeA; }

    const rawA = this.getCachedTheme(themeA);
    const rawB = this.getCachedTheme(themeB);

    // Keep re-using the same preallocated array
    this.lerpArrays(rawA.background, rawB.background, t, _scratchArrayVal);
    const background = ColorService.rawToRgba(_scratchArrayVal as RawRgb);

    this.lerpArrays(rawA.gui, rawB.gui, t, _scratchArrayVal);
    const gui = ColorService.rawToRgba(_scratchArrayVal as RawRgb);

    this.lerpArrays(rawA.guiAccent, rawB.guiAccent, t, _scratchArrayVal);
    const guiAccent = ColorService.rawToRgba(_scratchArrayVal as RawRgb);

    // This part still allocates a new string array for the resulting ITheme, 
    // which is unavoidable since the consumer expects an ITheme interface.
    const effects = rawA.effects.map((colorA, i) => {
      this.lerpArrays(colorA, rawB.effects[i], t, _scratchArrayVal);
      return ColorService.rawToRgba(_scratchArrayVal as RawRgb);
    });

    const parallax = rawA.parallax.map((colorA, i) => {
      this.lerpArrays(colorA, rawB.parallax[i], t, _scratchArrayVal);
      return ColorService.rawToRgba(_scratchArrayVal as RawRgb);
    });

    const objects = rawA.objects.map((colorA, i) => {
      this.lerpArrays(colorA, rawB.objects[i], t, _scratchArrayVal);
      return ColorService.rawToRgba(_scratchArrayVal as RawRgb);
    });

    return { id: themeA.id, name: themeA.name, background, gui, guiAccent, effects, parallax, objects };
  }

  public static lerpArrays(
    a: number[],
    b: number[],
    t: number,
    out?: number[]
  ): number[] {
    const len = a.length;

    // Prepare output array
    const res = out || new Array(len);
    if (res.length !== len) { res.length = len; }

    for (let i = 0; i < len; i++) {
      res[i] = a[i] + (b[i] - a[i]) * t;
    }

    return res;
  }

  public static getRandom(
    keyframe: Keyframe,
    out: number[],
    seed?: number
  ): number[] {
    if (!keyframe.random || !keyframe.randomize || keyframe.randomize === Randomize.None) { return keyframe.data; }

    const SEED_OFFSET = 761;

    const dataA = keyframe.data;
    const dataB = keyframe.random;
    const len = dataA.length;

    // Ensure output array is the same size
    const results = out || new Array(len);
    if (results.length !== len) { results.length = len; }

    // Use the keyframe's seed if one isn't provided
    const baseSeed = seed ?? keyframe.randomSeed;

    switch (keyframe.randomize) {
      case Randomize.Linear: {
        for (let i = 0; i < len; i++) {
          const elementSeed = baseSeed + (i * SEED_OFFSET); 
          const r = this.seededRandom(elementSeed);
          let value = r * (dataB[i] - dataA[i]) + dataA[i];

          // Handle randomize interval
          if (keyframe.randomizeInterval !== undefined) {
            const interval = keyframe.randomizeInterval;
            value = interval === 0 ? value : Math.round(value / interval) * interval;
          }

          out[i] = value;
        }
        break;
      }

      case Randomize.Toggle: {
        const seed = baseSeed + SEED_OFFSET; // Only one seed for every element
        const source = this.seededRandom(seed) >= 0.5 ? dataA : dataB;

        for (let i = 0; i < len; i++) { results[i] = source[i]; }
        break;
      }

      case Randomize.Relative: {
        const seed = baseSeed + SEED_OFFSET; // Only one seed for every element
        const r = this.seededRandom(seed);
        const scale = r * (dataB[1] - dataB[0]) * dataB[0];

        for (let i = 0; i < len; i++) { out[i] = dataA[i] * scale; }
        break;
      }
    }

    return results;
  }

  public static interpolateTrack(track: KeyframeTrack, time: number) {
    const { prev, next } = track.keyframesAt(time);
    const duration = next.time - prev.time;

    const progress = duration === 0 ? 1 : (time - prev.time) / duration;
    const clamped = progress < 0 ? 0 : (progress > 1 ? 1 : progress);
    
    _trackQueryResult.prev = prev;
    _trackQueryResult.next = next;
    _trackQueryResult.t = getEasing(next.easing)(clamped);

    return _trackQueryResult;
  }

  public static seededRandom(seed: number) {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) * 2.3283064365386963e-10; // Faster than division
  }

  public static seededRandomBetween(min: number, max: number, seed: number) {
    return this.seededRandom(seed) * (max - min) + min;
  }

  private static getCachedTheme(theme: ITheme): CachedTheme {
    if (!_themeCache.has(theme.id)) {
      const background = ColorService.rgbaToRaw(theme.background);
      const gui = ColorService.rgbaToRaw(theme.gui);
      const guiAccent = ColorService.rgbaToRaw(theme.guiAccent);

      const effects = theme.effects.map(hex => ColorService.rgbaToRaw(hex));
      const parallax = theme.parallax.map(hex => ColorService.rgbaToRaw(hex));
      const objects = theme.objects.map(hex => ColorService.rgbaToRaw(hex));

      _themeCache.set(theme.id, { background, gui, guiAccent, effects, parallax, objects });
    }
    return _themeCache.get(theme.id)!;
  }
}