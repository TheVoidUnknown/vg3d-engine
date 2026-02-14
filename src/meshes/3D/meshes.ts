import Cube from "./Cube";
import Dodecahedron from "./Dodecahedron";
import Icosahedron from "./Icosahedron";

const Meshes = {
  Cube,
  Dodecahedron,
  Icosahedron
} as const;

export type MeshType = keyof typeof Meshes;

export default Meshes;