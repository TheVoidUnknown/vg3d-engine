import type { Matrix4, Vector3 } from "three";
import type { IMesh } from "./Mesh.types";
import { MeshService } from "$lib/engine/services/MeshService";
import type { MeshType } from "$lib/engine/meshes/3DMeshes";
import type { RawRgb } from "$lib/engine/services/ColorService";
import type { VgdMeshType } from "$lib/engine/meshes/2D/VgdMeshes";

const DEFAULT: IMesh = {
  name: "Empty" as MeshType,
  vertices: [],
  faces: []
}

export default class Mesh implements IMesh {
  public readonly name: MeshType | VgdMeshType;
  public readonly vertices: Vector3[];
  public readonly faces: number[][];

  public _isDirty: boolean;
  public _indices: Uint16Array;
  public _flatMesh: Float32Array;
  public _flatNormals: Float32Array;
  public _material: {
    color: RawRgb;
    shade: RawRgb;
  };


  constructor(
    initial?: IMesh,
  ) {
    this._isDirty = true;
    this._indices = new Uint16Array();
    this._flatMesh = new Float32Array();
    this._flatNormals = new Float32Array();
    this._material = {
      color: [1.0, 1.0, 1.0],
      shade: [0.0, 0.0, 0.0]
    }

    if (initial) {
      this.name = initial.name;
      this.vertices = structuredClone(initial.vertices);
      this.faces = structuredClone(initial.faces);
    } else {
      this.name = DEFAULT.name;
      this.vertices = structuredClone(DEFAULT.vertices);
      this.faces = structuredClone(DEFAULT.faces);
    }
  }

  public static from(mesh: IMesh, skipMeshProcessing = false): Mesh {
    const instance = MeshService.prepareMesh(mesh, skipMeshProcessing);

    // ALWAYS ensure these exist, MeshRegistry depends on them
    if (!instance._flatMesh)    { instance._flatMesh = new Float32Array(0);    }
    if (!instance._flatNormals) { instance._flatNormals = new Float32Array(0); }

    return instance;
  }

  public applyMatrix4(matrix: Matrix4): this {
    const transformedVertices: Vector3[] = [];

    for (const v of this.vertices) { v.applyMatrix4(matrix); }

    this._flatMesh = MeshService.flatMapMesh(transformedVertices, this._indices);
    this._flatNormals = MeshService.flatMapNormals(transformedVertices, this._indices);

    return this;
  }
}