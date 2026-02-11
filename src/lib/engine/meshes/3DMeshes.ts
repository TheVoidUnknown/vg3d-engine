import Cube from "./3D/Cube";
import Dodecahedron from "./3D/Dodecahedron";
import Icosahedron from "./3D/Icosahedron";

const Meshes = {
  Cube,
  Dodecahedron,
  Icosahedron
} as const;

export type MeshType = keyof typeof Meshes;

export default Meshes;