import { Vector3 } from "three";
import type { IMesh } from "../core/mesh/Mesh.types";

export function parseObj(data: string): IMesh {
  const vertices: Vector3[] = [];
  const faces: number[][] = [];

  const lines = data.split("\n");

  for (const line of lines) {
    const parts = line.split(" ");
    const lineType = parts.shift();

    switch (lineType) {
      case 'v': {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        const z = parseFloat(parts[2]);

        vertices.push(new Vector3(x, y, z));
      break; }

      case 'f': {
        const faceIndices = parts.map(part => {
          // OBJ indices are 1-based, so we subtract 1
          return parseInt(part.split('/')[0]) - 1;
        });

        faces.push(faceIndices);
      break; }

      default: {
        // Ignore other line types like 'vn', 'vt', comments, etc.
      break; }
    }
  }

  return {
    name: "Custom",
    vertices,
    faces
  };
}