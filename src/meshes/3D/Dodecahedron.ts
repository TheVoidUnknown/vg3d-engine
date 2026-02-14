import { Vector3 } from "three";
import type { IMesh } from "../core/mesh/Mesh.types";

const Dodecahedron = (): IMesh => {
  return {
    name: "Dodecahedron",
    vertices: [
      new Vector3(0.57735, 0.57735, -0.57735),
      new Vector3(0.57735, -0.57735, -0.57735),
      new Vector3(0.57735, 0.57735, 0.57735),
      new Vector3(0.57735, -0.57735, 0.57735),
      new Vector3(-0.57735, 0.57735, -0.57735),
      new Vector3(-0.57735, -0.57735, -0.57735),
      new Vector3(-0.57735, 0.57735, 0.57735),
      new Vector3(-0.57735, -0.57735, 0.57735),
      new Vector3(0.356822, 0, -0.934172),
      new Vector3(-0.356822, 0, -0.934172),
      new Vector3(0.356822, 0, 0.934172),
      new Vector3(-0.356822, 0, 0.934172),
      new Vector3(0.934172, 0.356822, 0),
      new Vector3(0.934172, -0.356822, 0),
      new Vector3(-0.934172, 0.356822, 0),
      new Vector3(-0.934172, -0.356822, 0),
      new Vector3(0, 0.934172, -0.356822),
      new Vector3(0, 0.934172, 0.356822),
      new Vector3(0, -0.934172, -0.356822),
      new Vector3(0, -0.934172, 0.356822),
    ],
    
    faces: [
      [0,  8,  9,  4,  16],
      [0,  12, 13, 1,  8 ],
      [0,  16, 17, 2,  12],
      [8,  1,  18, 5,  9 ],
      [12, 2,  10, 3,  13],
      [16, 4,  14, 6,  17],
      [9,  5,  15, 14, 4 ],
      [6,  11, 10, 2,  17],
      [3,  19, 18, 1,  13],
      [7,  15, 5,  18, 19],
      [7,  11, 6,  14, 15],
      [7,  19, 3,  10, 11]
    ]
  }
}

export default Dodecahedron;