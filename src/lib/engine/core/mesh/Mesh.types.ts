import type { VgdMeshType } from "$lib/engine/meshes/2D/VgdMeshes";
import type { MeshType } from "$lib/engine/meshes/3DMeshes";
import type { Vector3 } from "three";

export interface IMesh {
  name: MeshType | VgdMeshType;
  vertices: Vector3[];
  faces: number[][];
}