import { Vector3 } from "three";
import type { IMesh } from "../core/mesh/Mesh.types";
import { VgdShapeMap, type VgdMeshType } from "../meshes/2D/meshes";
import { MeshRegistry } from "../core/meshRegistry/MeshRegistry";
import { Meshes, type MeshType } from "../meshes/3D/meshes";

export function registerMeshes() {
  MeshRegistry.init();

  // Register 3D meshes
  for (const k in Meshes) {
    const key = k as MeshType;
    const func = Meshes[key];

    MeshRegistry.registerMesh(func());
  }

  // Register 2D meshes
  for (let shape = 0; shape < VgdShapeMap.length; shape++) {
    for (let shapeOffset = 0; shapeOffset < VgdShapeMap[shape].length; shapeOffset++) {
      const data = structuredClone(VgdShapeMap[shape][shapeOffset]);
    
      const newMesh: IMesh = {
        name: data.name as VgdMeshType,
        faces: data.faces as unknown as number[][], // FIXME: Fix this typing workaround 
        vertices: []
      }
    
      data.vertices.forEach((v) => {
        newMesh.vertices.push(new Vector3().fromArray(v));
      })

      // Meshes are already triangulated, don't process them
      MeshRegistry.registerMesh(newMesh, true);
    }
  }
}