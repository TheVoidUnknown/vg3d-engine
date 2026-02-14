import { ExportConverterService } from "../../services/ExportConverterService";
import { getVgdOffsetsFromName } from "../../meshes/2D/meshes";

import type { Animation2DComponent } from "./Animation2DComponent";
import type { Animatable } from "../../core/animatable/Animatable";
import type { ExportHandler } from "../../core/exportRegistry/ExportRegistry";
import type { IVgdLevelObject } from "../../vgd/Vgd.types";


export const exportAnimation2DComponent: ExportHandler = (
  component: Animation2DComponent,
  target: Animatable
) => {
  const object: IVgdLevelObject = {
    id: target.id,
    n: target.name,

    ak_t: 3, // Fixed time
    ak_o: component.lifetime,
    st: component.spawnTime,

    e: [
      { k: [ { ev: [ 0, 0 ] } ] },
      { k: [ { ev: [ 1, 1 ] } ] },
      { k: [ { ev: [ 0, 0 ] } ] },
      { k: [ { ev: [ 0, 0 ] } ] }
    ]
  }

  if (component.tracks.Move) {
    object.e[0].k = ExportConverterService.toVgdKeyframeTrack("Move", component.tracks.Move, component.spawnTime);
  }
  if (component.tracks.Scale) {
    object.e[1].k = ExportConverterService.toVgdKeyframeTrack("Scale", component.tracks.Scale, component.spawnTime);
  }
  if (component.tracks.Rotation) {
    object.e[2].k = ExportConverterService.toVgdKeyframeTrack("Rotation", component.tracks.Rotation, component.spawnTime);
  }
  if (component.tracks.Color) {
    object.e[3].k = ExportConverterService.toVgdKeyframeTrack("Color", component.tracks.Color, component.spawnTime);
  }

  if (component.parentId) { object.p_id = component.parentId; }
  if (component.origin && component.origin.x !== 0 && component.origin.y !== 0) {
    object.o = structuredClone(component.origin);
  }

  if (component.zOffset && component.zOffset !== -30) {
    object.d = Math.max(Math.min(0 - Math.floor(component.zOffset), 60), 0);
  }

  if (component.parentSettings) {
    const types = [
      component.parentSettings.Move?.enabled ? "1" : "0", 
      component.parentSettings.Scale?.enabled ? "1" : "0", 
      component.parentSettings.Rotation?.enabled ? "1" : "0"
    ]

    const offsets = [
      component.parentSettings.Move?.offset ?? 0, 
      component.parentSettings.Scale?.offset ?? 0, 
      component.parentSettings.Rotation?.offset ?? 0
    ]

    if (types.join("") !== "101") { object.p_t = types.join(""); }
    if (!offsets.every((o) => o == 0)) { object.p_o = offsets; }
  }

  if (component.mesh) {
    object.ot = 5; // No-Hit

    const { s, so } = getVgdOffsetsFromName(component.mesh);
    if (s > 0) { object.s = s; }
    if (so > 0) { object.so = so; }
  } else {
    object.ot = 6; // Empty
  }

  return [ object ];
}