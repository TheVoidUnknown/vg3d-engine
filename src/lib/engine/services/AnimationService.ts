import type { ComponentType } from "../core/component/Component.types";
import { getEasing } from "../core/easing/Easing.const";
import type Keyframe from "../core/keyframe/Keyframe";
import type { KeyframeType } from "../core/keyframe/Keyframe.types";
import type KeyframeTrack from "../core/keyframeTrack/KeyframeTrack";
import type { ITheme } from "../core/level/Level.types";
import ColorService, { type RawRgb } from "./ColorService";

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
    parentSettings?: IParentSettings,
    isRootNode = false,
    out: IAnimationParameters = {} // Optional mutation target to avoid allocation
  ): IAnimationParameters {
    // TODO: Ideally component.tracks should be arraylike, but whatever
    // This loop has a lot of overhead, but it's not worth refactoring
    // until `KeyframeTrack` is rewritten.
    for (const k in component.tracks) {
      const key = k as KeyframeType;
      const track = component.tracks[key];
      if (!track) { continue; }

      // Resolve parent settings
      let enabled = true;
      let offset = 0;

      if (parentSettings) {
        const setting = parentSettings[key];
        if (setting) {
          enabled = setting.enabled;
          offset = setting.offset;
        }
      }

      // Interpolate Track
      this.interpolateTrack(track, time - offset); 
      const { prev, next, t } = _trackQueryResult;

      let prevData = prev.data;
      let nextData = next.data;

      // Handle Randomization
      if (prev.randomize) { prevData = this.getRandom(prev, _scratchRandomPrev); }
      if (next.randomize) { nextData = this.getRandom(next, _scratchRandomNext); }

      // Lerp result
      if (enabled || !isRootNode) {
        let targetArr = out[key];
        if (!targetArr) {
          targetArr = [];
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

    if (!themeA && !themeB) throw new Error("Missing themes for interpolation");
    if (!themeA) { return themeB!; }
    if (!themeB) { return themeA; }

    const rawA = this.getCachedTheme(themeA);
    const rawB = this.getCachedTheme(themeB);

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
    if (res.length !== len) res.length = len;

    for (let i = 0; i < len; i++) {
      res[i] = a[i] + (b[i] - a[i]) * t;
    }
    return res;
  }

  public static getRandom(
    keyframe: Keyframe,
    out?: number[],
    seed?: number
  ): number[] {
    if (!keyframe.random || !keyframe.randomize || keyframe.randomize === "None") { return keyframe.data; }

    const dataA = keyframe.data;
    const dataB = keyframe.random;
    const len = dataA.length;

    // Ensure output array is the same size
    const results = out || new Array(len);
    if (results.length !== len) { results.length = len; }

    // Use the keyframe's seed if one isn't provided
    const baseSeed = seed ?? keyframe.randomSeed;

    switch (keyframe.randomize) {
      case "Linear": {
        for (let i = 0; i < len; i++) {
          const elementSeed = baseSeed + (i * 761); 
          results[i] = this.seededRandomBetween(dataA[i], dataB[i], elementSeed);
        }
        break;
      }

      case "Toggle": {
        for (let i = 0; i < len; i++) {
          const elementSeed = baseSeed + (i * 761);
          const source = this.seededRandom(elementSeed) >= 0.5 ? dataA : dataB;
          results[i] = source[i];
        }
        break;
      }
    }

    return results;
  }

  public static interpolateTrack(track: KeyframeTrack, time: number) {
    const { prev, next } = track.keyframesAt(time);
    const duration = next.time - prev.time;

    const progress = duration === 0 ? 1 : Math.max(0, Math.min(1, (time - prev.time) / duration));
    
    _trackQueryResult.prev = prev;
    _trackQueryResult.next = next;
    _trackQueryResult.t = getEasing(next.easing)(progress);

    return _trackQueryResult;
  }

  public static seededRandom(seed: number) {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
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