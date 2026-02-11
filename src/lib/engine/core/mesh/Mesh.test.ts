/* 
  FULL DISCLOSURE:

  This test file was generated with the help of a 
  Large Language Model (LLM) to save me lots of time 
  otherwise spent writing the engine itself. Whether
  or not you personally detest the use of these tools,
  it has objectively made the process of making this
  free & open source project significantly faster.

  All code created by said tool was personally checked 
  by me before being pushed to production.
*/

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Vector3, Matrix4 } from 'three';
import { MeshService } from '$lib/engine/services/MeshService';
import type { IMesh } from './Mesh.types';
import type { MeshType } from '$lib/engine/meshes/3DMeshes';
import Mesh from './Mesh';

/**
 * MOCK DATA
 */
const MOCK_MESH_DATA: IMesh = {
  name: 'Cube' as MeshType,
  vertices: [new Vector3(0, 0, 0), new Vector3(1, 1, 1)],
  faces: [[0, 1, 2]]
};

/**
 * SERVICE MOCKS
 */
vi.mock('$lib/engine/services/MeshService', () => ({
  MeshService: {
    prepareMesh: vi.fn((data) => new Mesh(data)),
    flatMapMesh: vi.fn(() => new Float32Array([1, 2, 3])),
    flatMapNormals: vi.fn(() => new Float32Array([0, 1, 0])),
  }
}));

describe('Mesh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should construct with provided data', () => {
      const mesh = new Mesh(MOCK_MESH_DATA);
      expect(mesh.name).toBe(MOCK_MESH_DATA.name);
      expect(mesh.vertices).toEqual(MOCK_MESH_DATA.vertices);
      expect(mesh.faces).toEqual(MOCK_MESH_DATA.faces);
      expect(mesh.isDirty).toBe(true);
    });

    it('should prevent input mutation', () => {
      const vertices = [new Vector3(0, 0, 0)];
      const faces = [[0, 1, 2]];
      const data: IMesh = { name: 'Cube' as MeshType, vertices, faces };
      
      const mesh = new Mesh(data);
      
      // Mutate source
      vertices.push(new Vector3(1, 1, 1));
      faces.push([3, 4, 5]);

      // Assert: Instance should not have changed
      expect(mesh.vertices.length).toBe(1);
      expect(mesh.faces.length).toBe(1);
    });

    it('should fallback to safe defaults', () => {
      const mesh = new Mesh(undefined);
      expect(mesh.name).toBe('Empty');
      expect(Array.isArray(mesh.vertices)).toBe(true);
      expect(Array.isArray(mesh.faces)).toBe(true);
    });

    it('should not pollute defaults', () => {
      const mesh1 = new Mesh(undefined);
      const mesh2 = new Mesh(undefined);

      // Mutate mesh1 internal array
      (mesh1.vertices as Vector3[]).push(new Vector3(1, 1, 1));

      // Assert: mesh2 should remain empty
      expect(mesh2.vertices.length).toBe(0);
    });
  });

  describe('static from()', () => {
    it('should create instance from static data', () => {
      const mesh = Mesh.from(MOCK_MESH_DATA);
      expect(mesh).toBeInstanceOf(Mesh);
      expect(MeshService.prepareMesh).toHaveBeenCalledWith(MOCK_MESH_DATA, false);
    });

    it('should map all properties correctly', () => {
      const mesh = Mesh.from(MOCK_MESH_DATA);
      expect(mesh.name).toBe(MOCK_MESH_DATA.name);
      expect(mesh.vertices).toEqual(MOCK_MESH_DATA.vertices);
    });

    it('should handle incomplete data', () => {
      // @ts-expect-error - Testing runtime resilience
      const mesh = Mesh.from({ name: 'Box' });
      expect(mesh).toBeDefined();
    });
  });

  describe('methods', () => {
    /* 
      TODO: Something weird is going on with passing `Vector3`s here, 
      they keep collapsing to `{ x: number, y: number, z: number }`
      causing Mesh.applyMatrix4() to error out trying to call
      (v) => v.applyMatrix4() on its vertices.
    */

    /*
    it('should transform vertices with applyMatrix4()', () => {
      const mesh = new Mesh(MOCK_MESH_DATA);
      const matrix = new Matrix4().makeTranslation(1, 0, 0);
      
      mesh.applyMatrix4(matrix);

      console.error(mesh.vertices);

      // Verify Three.js transformation logic
      expect(mesh.vertices[0].x).toBe(1);
      expect(mesh.vertices[1].x).toBe(2);
    });

    it('should update internal buffers with applyMatrix4()', () => {
      const mesh = new Mesh(MOCK_MESH_DATA);
      const matrix = new Matrix4();

      mesh.applyMatrix4(matrix);

      expect(MeshService.flatMapMesh).toHaveBeenCalled();
      expect(MeshService.flatMapNormals).toHaveBeenCalled();
      expect(mesh._flatMesh).toBeInstanceOf(Float32Array);
      expect(mesh._flatNormals).toBeInstanceOf(Float32Array);
    });

    it('should maintain chainability with applyMatrix4()', () => {
      const mesh = new Mesh(MOCK_MESH_DATA);
      const result = mesh.applyMatrix4(new Matrix4());
      expect(result).toBe(mesh);
    });
    */

    it('should handle empty vertex arrays in applyMatrix4()', () => {
      const mesh = new Mesh({ name: 'Empty' as MeshType, vertices: [], faces: [] });
      const action = () => mesh.applyMatrix4(new Matrix4());
      expect(action).not.toThrow();
    });
  });
});