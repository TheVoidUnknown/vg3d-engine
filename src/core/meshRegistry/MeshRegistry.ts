import Mesh from "../mesh/Mesh";

import type { VgdMeshType } from "../../meshes/2D/meshes";
import type { MeshType } from "../../meshes/3D/meshes";
import type { IMesh } from "../mesh/Mesh.types";

export default class MeshRegistry {
  public static meshData: Map<string, IMesh>;
  public static meshes: Map<string, Mesh>;

  public static init() {
    this.meshData = new Map();
    this.meshes = new Map();

    console.info("MeshRegistry initialized");
  }

  public static registerMesh(data: IMesh, skipMeshProcessing = false) {
    if (this.meshData.has(data.name)) {
      console.warn(`Mesh with name "${data.name}" was already registered! The previous entry will be overwritten!`);
      this.meshData.delete(data.name);
      this.meshes.delete(data.name);
    }

    this.meshData.set(data.name, structuredClone(data));
    const mesh = Mesh.from(data, skipMeshProcessing);
    this.meshes.set(mesh.name, mesh);
  }

  public static new(name: MeshType | VgdMeshType): Mesh {
    const data = this.meshData.get(name);
    if (!data) { throw new Error(`Mesh with name "${name}" was not registered.`); }

    return Mesh.from(data);
  }

  public static getFlatMesh(name: MeshType | VgdMeshType): Float32Array {
    const mesh = this.meshes.get(name);
    if (!mesh) { throw new Error(`Mesh with name "${name}" was not registered.`); }

    return mesh._flatMesh;
  }

  public static getFlatNormals(name: MeshType | VgdMeshType): Float32Array {
    const mesh = this.meshes.get(name);
    if (!mesh) { throw new Error(`Mesh with name "${name}" was not registered.`); }

    return mesh._flatNormals;
  }
}