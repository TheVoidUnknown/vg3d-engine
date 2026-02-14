import { Cube } from "./Cube";
import { Dodecahedron } from "./Dodecahedron";
import { Icosahedron } from "./Icosahedron";

export const Meshes = {
  Cube,
  Dodecahedron,
  Icosahedron
} as const;

export type MeshType = keyof typeof Meshes;