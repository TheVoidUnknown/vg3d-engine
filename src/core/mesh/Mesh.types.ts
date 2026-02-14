import type { VgdMeshType } from "../../meshes/2D/meshes";
import type { MeshType } from "../../meshes/3D/meshes";
import type { Vector3 } from "three";

export interface IMesh {
  name: MeshType | VgdMeshType;
  vertices: Vector3[];
  faces: number[][];
}