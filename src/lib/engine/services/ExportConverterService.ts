import type Animatable from "../core/animatable/Animatable";
import ExportRegistry from "../core/exportRegistry/ExportRegistry";
import type Keyframe from "../core/keyframe/Keyframe";
import { Randomize, type KeyframeType } from "../core/keyframe/Keyframe.types";
import type KeyframeTrack from "../core/keyframeTrack/KeyframeTrack";
import type Level from "../core/level/Level";
import type { ITheme } from "../core/level/Level.types";
import { VgdRandomize, type IVgdKeyframe, type IVgdLevel, type IVgdLevelObject, type IVgdTheme } from "../vgd/Vgd.types";
import ColorService from "./ColorService";

export default class ExportConverterService {
  public static toVgdLevel(instance: Level): IVgdLevel {
    const level: IVgdLevel = {
      events: [[], [], [], [], [], [], [], [], []],
      objects: [],
      themes: []
    }

    instance._objects.forEach((o) => {
      if (!o) { return; }
      level.objects.push(...this.toVgdLevelObject(o, instance._objects));
    })

    instance.themes.forEach((t) => {
      level.themes!.push(this.toVgdTheme(t))
    })

    return level;
  }

  public static toVgdLevelObject(
    instance: Animatable,
    allObjects?: (Animatable | null)[]
  ): IVgdLevelObject[] {
    const objects: IVgdLevelObject[] = [];

    instance.components.forEach((comp) => {
      const levelObjects = ExportRegistry.runHandler(comp, instance, allObjects ?? []);
      for (const o of levelObjects) { objects.push(o); }
    })

    return objects;
  }

  public static toVgdTheme(data: ITheme): IVgdTheme {
    const theme: IVgdTheme = {
      name: data.name,
      id: data.id,

      pla: ["E57373","64B5F6","81C784","FFB74D"],
      obj: data.objects.map((c) => ColorService.rgbaToHex(c)),
      fx: data.effects.map((c) => ColorService.rgbaToHex(c)),
      bg: data.parallax.map((c) => ColorService.rgbaToHex(c)),

      base_bg: ColorService.rgbaToHex(data.background),
      base_gui: ColorService.rgbaToHex(data.gui),
      base_gui_accent: ColorService.rgbaToHex(data.guiAccent)
    }

    return theme;
  }

  public static toVgdKeyframeTrack(
    type: KeyframeType,
    instance: KeyframeTrack,
    offset: number
  ): IVgdKeyframe[] {
    const keyframes: IVgdKeyframe[] = [];

    for (const kf of instance) { keyframes.push(this.toVgdKeyframe(type, kf, offset)); }

    return keyframes;
  }

  public static toVgdKeyframe(
    type: KeyframeType,
    instance: Keyframe,
    offset: number
  ): IVgdKeyframe {
    const keyframe: IVgdKeyframe = { ev: [] };

    switch (type) {
      case "Color": {
        keyframe.ev = [ instance.data[0] ];
        if (instance.data[1] !== 100) { keyframe.ev.push(instance.data[1]); }
        break;
      }

      case "Rotation": {
        keyframe.ev = [ instance.data[0] ];
        if (instance.data[1]) { keyframe.ev.push(instance.data[1]); }
        break;
      }

      default: {
        keyframe.ev = [ instance.data[0], instance.data[1] ];
        break;
      }
    }

    if (instance.time && instance.time - offset > 0) { keyframe.t = instance.time - offset; }

    if (instance.randomize && instance.randomize !== Randomize.None) {
      keyframe.r = Object.values(VgdRandomize).indexOf(instance.randomize);
    }

    if (instance.easing && instance.easing !== "Linear") { keyframe.ct = instance.easing; }
    if (instance.themeId) { keyframe.evs = [ instance.themeId ]; }
    if (instance.random) {
      keyframe.er = [ instance.random[0], instance.random[1] ];
      if (instance.randomizeInterval !== undefined) { keyframe.er[2] = instance.randomizeInterval; }
    }

    return keyframe;
  }
}