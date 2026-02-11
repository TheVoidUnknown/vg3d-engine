import Animatable from "../core/animatable/Animatable";
import Level from "../core/level/Level";
import Keyframe from "../core/keyframe/Keyframe";
import KeyframeTrack from "../core/keyframeTrack/KeyframeTrack";

import type { IVgdEvents, IVgdKeyframe, IVgdLevel, IVgdLevelObject, IVgdPrefab, IVgdPrefabInstance, IVgdTheme } from "../vgd/Vgd.types";
import ColorService from "./ColorService";
import type { ITheme } from "../core/level/Level.types";
import { Randomizer, type KeyframeType, type RandomizerType } from "../core/keyframe/Keyframe.types";
import type Animation2DComponent from "../core/component/Animation2DComponent";
import { getVgdMeshName } from "../meshes/2D/VgdMeshes";
import { generateUUID } from "three/src/math/MathUtils.js";

interface ConversionStats {
  conversionTime: number;

  themes: number;
  objects: number;
  prefabs: number;
  prefabInstances: number;
  keyframes: { [K in KeyframeType]?: number };
}

export default class VgdConverterService {
  public static stats: ConversionStats;

  public static resetStats() {
    this.stats = {
      conversionTime: 0,

      themes: 0,
      objects: 0,
      prefabs: 0,
      prefabInstances: 0,
      keyframes: {}
    }
  }

  public static levelFromVgd(data: IVgdLevel): Level {
    this.resetStats();
    const t1 = performance.now();
    const level = new Level();

    level.events = this.eventsFromVgd(data.events);

    if (data.objects) {
      data.objects.forEach((o) => {
        level.addObject(this.animatableFromVgd(o));
        this.stats.objects++;
      });
    }

    if (
      (data.prefabObjects || data.prefab_objects)
      && data.prefabs && data.prefabs.length > 0
    ) {
      const instances = data.prefabObjects ?? data.prefab_objects;
      if (instances && instances.length > 0) {
        instances.forEach((i) => {
          const prefab = data.prefabs!.filter((p) => p.id === i.pid)[0];
          if (!prefab) { return; }
          
          this.prefabInstanceFromVgd(i, prefab).forEach((o) => {
            level.addObject(o);
            this.stats.objects++;
          })

          this.stats.prefabInstances++;
        });
      }
    }

    /*
    TODO: prefab registry and register level prefabs
    if (data.prefabs) {
      data.prefabs.forEach((p) => {
        p.objs.forEach((o) => {
          level.objects.set(o.id, this.animatableFromVgd(o));
        });
      })
    }
    */

    if (data.prefabs) { this.stats.prefabs = data.prefabs.length; }

    if (data.themes) {
      data.themes.forEach((t) => {
        level.themes.set(t.id, this.themeFromVgd(t));
      })
    }

    const t2 = performance.now();
    this.stats.conversionTime = t2 - t1;
    return level;
  }

  // TODO: Implement prefab component instead of dumping prefab instances
  public static prefabInstanceFromVgd(instance: IVgdPrefabInstance, prefab: IVgdPrefab): Animatable[] {
    const objects: Animatable[] = [];

    const parent = new Animatable();
    const comp = parent.addComponent("Animation2D");

    parent.id = instance.id;
    parent.name = "Prefab Parent";

    comp.spawnTime = instance.t;

    if (instance.e) {
      const move = instance.e[0]?.ev ?? [0, 0];
      const scale = instance.e[1]?.ev ?? [1, 1];

      comp.addKeyframe("Move", { data: [ move[0] ?? 0,  move[1] ?? 0 ] });
      comp.addKeyframe("Scale", { data: [ scale[0] ?? 0, scale[1] ?? 0 ] });
    }

    objects.push(parent);

    prefab.objs.forEach((o) => {
      o.id = generateUUID();
      if (!o.p_id) { o.p_id = parent.id; o.p_t = "111"; }

      objects.push(this.animatableFromVgd(o, instance.t));
    })

    return objects;
  }

  public static animatableFromVgd(data: IVgdLevelObject, timeOffset = 0): Animatable {
    const object = new Animatable();
    object.addComponent("Animation2D");
    const comp = object.getComponent("Animation2D") as Animation2DComponent;

    const startTime = (data.st ?? 0) + timeOffset;
    comp.zOffset = 0 - (data.d ?? 20);
    comp.spawnTime = startTime;

    comp
      .setParenting("Move", true)
      .setParenting("Scale", false)
      .setParenting("Rotation", true)

    const move =     this.keyframeTrackFromVgd(data.e[0].k, "Move",     startTime);
    const scale =    this.keyframeTrackFromVgd(data.e[1].k, "Scale",    startTime);
    const rotation = this.keyframeTrackFromVgd(data.e[2].k, "Rotation", startTime);
    const color =    this.keyframeTrackFromVgd(data.e[3].k, "Color",    startTime);

    comp.createTrack("Move", move);
    comp.createTrack("Scale", scale);
    comp.createTrack("Rotation", rotation);
    comp.createTrack("Color", color);

    if (data.ak_t) {
      switch (data.ak_t) {
        case (1): { // Last keyframe
          let longest = 0;

          [move, scale, rotation, color].forEach((track) => {
            track.sortByTime();
            track.forEach((kf) => { if (kf.time > longest) { longest = kf.time; } });
          });

          comp.lifetime = (longest - comp.spawnTime);
          break;
        }

        case (2): { // Last keyframe offset
          let longest = 0;

          [move, scale, rotation, color].forEach((track) => {
            track.sortByTime();
            track.forEach((kf) => { if (kf.time > longest) { longest = kf.time; } });
          });

          comp.lifetime = (longest - comp.spawnTime) + (data.ak_o || 0);
          break;
        }

        case (3): { // Fixed time
          comp.lifetime = (data.ak_o || 0);
          break;
        }

        case (4): { // Song time
          comp.lifetime = (data.ak_o || 0) - comp.spawnTime;
          break;
        }
      }
    }

    if (data.id) { object.id = data.id; }
    if (data.n) { object.name = data.n; }
    if (data.o) { comp.origin = { x: data.o.x, y: data.o.y }; }
    if (data.p_id) { comp.parentId = data.p_id; }
    if (data.p_t) {
      const types = data.p_t.split("");
      comp.setParenting("Move", types[0] == "1");
      comp.setParenting("Scale", types[1] == "1");
      comp.setParenting("Rotation", types[2] == "1");
    }
    if (data.p_o) {
      comp.setParentOffset("Move", data.p_o[0]);
      comp.setParentOffset("Scale", data.p_o[1]);
      comp.setParentOffset("Rotation", data.p_o[2]);
    }

    // Safety clamp
    if (data.s && data.s > 5) { data.s = 0; }
    if (data.so && data.so > [2, 8, 5, 1, 0, 5][data.s ?? 0]) { data.so = 0; }

    // Empty
    if (data.ot != 6 && data.ot != 3) {
      const meshName = getVgdMeshName(data.s, data.so);
      comp.mesh = meshName;
    } else {
      comp.mesh = undefined;
    }

    return object;
  }

  public static keyframeTrackFromVgd(
    data: IVgdKeyframe[],
    type: KeyframeType,
    timeOffset = 0
  ): KeyframeTrack {
    const track = new KeyframeTrack();

    if (type == "Rotation") {
      let rotation = 0;
      data.forEach((kf) => {
        if (kf.ev[1] == 1) { rotation = 0; }
        rotation += kf.ev[0];
        kf.ev[0] = rotation;
        track.push(this.keyframeFromVgd(kf, type, timeOffset));
      })
    } else {
      data.forEach((kf) => {
        track.push(this.keyframeFromVgd(kf, type, timeOffset));
      })
    }

    return track;
  }

  public static keyframeFromVgd(
    data: IVgdKeyframe,
    type: KeyframeType,
    timeOffset = 0
  ): Keyframe {
    const keyframe = new Keyframe();

    keyframe.time = (data.t ?? 0) + timeOffset;

    if (data.ct) { keyframe.easing = data.ct; }
    if (data.r) { keyframe.randomize = Object.keys(Randomizer)[data.r] as RandomizerType; }

    if (data.ev) {
      switch(type) {
        case "Color": {
          keyframe.data = [ data.ev[0], (data.ev[1] == undefined ? 100 : data.ev[1])/100 ];
          break;
        }

        case "Rotation": {
          keyframe.data = [ data.ev[0] ];
          break;
        }

        default: {
          keyframe.data = data.ev 
        }
      }
    }

    if (data.er) {
      switch(type) {
        case "Color": { keyframe.random = [ data.er[0], data.er[1] ?? 0 ]; break; }
        case "Rotation": { keyframe.random = [ data.er[0] ]; break; }
        default: { keyframe.random = data.er; }
      }
    }

    if (!this.stats.keyframes[type]) { this.stats.keyframes[type] = 1; } else { this.stats.keyframes[type]++; }
    return keyframe;
  }

  public static themeFromVgd(data: IVgdTheme): ITheme {
    const theme: ITheme = {
      id: data.id,
      name: data.name,

      objects: data.obj.map((c) => ColorService.hexToRgba(c) || { r: 0, g: 0, b: 0 }),
      effects: data.fx.map((c) => ColorService.hexToRgba(c) || { r: 0, g: 0, b: 0 }),
      parallax: data.bg.map((c) => ColorService.hexToRgba(c) || { r: 0, g: 0, b: 0 }),

      background: ColorService.hexToRgba(data.base_bg)!,
      gui: ColorService.hexToRgba(data.base_gui)!,
      guiAccent: ColorService.hexToRgba(data.base_gui_accent)!,
    }

    this.stats.themes++;
    return theme;
  }

  public static eventsFromVgd(data: IVgdEvents): Animatable {
    const events = new Animatable();
    const comp = events.addComponent("Animation3D")
      .addKeyframe("AmbientLight",          { data: [ 40 ]          })
      .addKeyframe("CameraFOV",             { data: [ 45 ]          })
      .addKeyframe("CameraMove",            { data: [ 0, 0, 100 ]   })
      .addKeyframe("CameraTarget",          { data: [ 0, 0, 0   ]   })
      .addKeyframe("LightSourceLuminosity", { data: [ 100 ]         })
      .addKeyframe("LightSourceMove",       { data: [ 100, 100, 0 ] })

    // Camera Move
    for (const kf of data[0]) {
      comp.addKeyframe("CameraMove", { data: [...kf.ev, 100], time: kf.t ?? 0, easing: kf.ct });
      comp.addKeyframe("CameraTarget", { data: [...kf.ev, 100], time: kf.t ?? 0, easing: kf.ct });
      if (!this.stats.keyframes.CameraMove) { this.stats.keyframes.CameraMove = 1; } else { this.stats.keyframes.CameraMove++; }
    }

    // Camera Zoom
    for (const kf of data[1]) {
      const zoom = this.toPaZoom(kf.ev[0] ?? 30);

      comp.addKeyframe("CameraFOV", { data: [ zoom ], time: kf.t ?? 0, easing: kf.ct });
      if (!this.stats.keyframes.CameraFOV) { this.stats.keyframes.CameraFOV = 1; } else { this.stats.keyframes.CameraFOV++; }
    }

    // Theme
    for (const kf of data[4]) {
      comp.addKeyframe("Theme", { themeId: kf.evs![0], time: kf.t ?? 0, easing: kf.ct });
      if (!this.stats.keyframes.Theme) { this.stats.keyframes.Theme = 1; } else { this.stats.keyframes.Theme++; }
    }

    return events;
  }

  // we love nonlinear relationships!!!
  public static toPaZoom(val: number): number {
    const a = -0.0028
    const b = 1.2
    const c = -0.1

    return a * Math.pow(val, 2) + b * val + c;
  }
}