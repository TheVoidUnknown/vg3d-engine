import { Vector3 } from "three";
import type { IMesh } from "../core/mesh/Mesh.types";

export const Cube = (): IMesh => {
  return {
    name: "Cube",
    vertices: [
      new Vector3(-1, -1, -1), // 0
      new Vector3( 1, -1, -1), // 1
      new Vector3( 1,  1, -1), // 2
      new Vector3(-1,  1, -1), // 3
      new Vector3(-1, -1,  1), // 4
      new Vector3( 1, -1,  1), // 5
      new Vector3( 1,  1,  1), // 6
      new Vector3(-1,  1,  1)  // 7
    ],
    faces: [
      [4, 7, 6, 5], // Front face
      [1, 2, 3, 0], // Back face
      [7, 3, 2, 6], // Top face
      [4, 5, 1, 0], // Bottom face
      [5, 6, 2, 1], // Right face
      [0, 3, 7, 4]  // Left face
    ]
  }
};