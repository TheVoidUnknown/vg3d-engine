import { Vector3 } from "three"
import type { IMesh } from "../../core/mesh/Mesh.types";
import VgdSquares from "./Square";
import VgdTriangles from "./Triangle";
import VgdPoint from "./Point";
import VgdCircles from "./Circle";
import VgdArrows from "./Arrow";
import VgdHexagons from "./Hexagon";

// Mesh data shamelessly stolen from
// https://github.com/Reimnop/ParallelAnimationSystem/blob/master/ParallelAnimationSystem/Core/PaAssets.cs
// thanks :grin:

export const VgdMeshNames = [
  ...VgdSquares.map((m) => m.name),
  ...VgdCircles.map((m) => m.name),
  ...VgdTriangles.map((m) => m.name),
  ...VgdArrows.map((m) => m.name),
  ...VgdPoint.map((m) => m.name),
  ...VgdHexagons.map((m) => m.name)
] as const;

export type VgdMeshType = typeof VgdMeshNames[number];

export const VgdShapeMap = [
  VgdSquares,

  VgdCircles,

  VgdTriangles,

  VgdArrows,

  // This mesh should never be used under normal circumstances,
  // but is here to prevent errors
  VgdPoint,

  VgdHexagons
] as const;

export function getVgdIMesh(
  shape?: number,
  shapeOffset?: number
): IMesh {
  const data = structuredClone(VgdShapeMap[shape||0][shapeOffset||0]);

  const newMesh: IMesh = {
    name: data.name,
    faces: data.faces as unknown as number[][], // thanks typescript
    vertices: []
  }

  data.vertices.forEach((v) => {
    newMesh.vertices.push(new Vector3().fromArray(v));
  })

  return newMesh;
}

export function getVgdMeshName(
  shape?: number,
  shapeOffset?: number
): VgdMeshType {
  return VgdShapeMap[shape||0][shapeOffset||0].name as VgdMeshType;
}

export function getVgdOffsetsFromName(
  name: VgdMeshType
): { s: number, so: number } {
  let s = 0;
  let so = 0;

  for (s = 0; s < 100; s++) {
    if (VgdShapeMap[s] === undefined) { break; }
    for (so = 0; so < 100; so++) {
      if (VgdShapeMap[s][so] === undefined) { break; }
      if (VgdShapeMap[s][so].name === name) { return { s, so }; }
    }
  }

  return { s, so };
}