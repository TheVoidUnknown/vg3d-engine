import { Vector3 } from "three";
import type { IMesh } from "../core/mesh/Mesh.types";
import { Mesh } from "../core/mesh/Mesh";
import earcut from "earcut";

export class MeshService {
  /**
   * Returns a prepared mesh with triangulated faces 
   * and properly wound vertex indices
   * 
   * @param {IMesh} mesh 
   * @returns {IMesh}
   */
  public static prepareMesh(mesh: IMesh, skipMeshProcessing = false): Mesh {
    const { vertices, faces } = mesh;
    const meshCenter = this.getGeometricCenter(mesh);
    const newMesh = new Mesh(mesh);

    let indices: Uint16Array;

    if (skipMeshProcessing) {
      // Just concat the faces and hope they're good
      let i: number[] = [];
      faces.forEach((f) => i = [...i, ...f])

      indices = new Uint16Array(i);
    } else {
      // Triangulate and re-wind indices
      indices = this.triangulateMesh(vertices, faces);
      indices = this.fixIndexWindingOrder(indices, vertices, meshCenter);
    }

    newMesh._indices = new Uint16Array(indices);

    // Compute flat map and normals for GL
    newMesh._flatMesh = this.flatMapMesh(newMesh.vertices, newMesh._indices);
    newMesh._flatNormals = this.flatMapNormals(newMesh.vertices, newMesh._indices);

    return newMesh;
  }

  public static getGeometricCenter(mesh: Mesh | IMesh): Vector3 {
    if (mesh.vertices.length === 0) { return new Vector3(0, 0, 0); }
  
    const sum = new Vector3(0, 0, 0);
  
    for (const v of mesh.vertices) {
      sum.add(v);
    }
  
    return sum.divideScalar(mesh.vertices.length);
  }

  /**
   * Takes in a mesh with any arbitrary number of vertices per face,
   * and uses earcut to triangulate it. May produce inconsistent index winding order.
   * 
   * @param {Vector3[]} vertices
   * @param {number[][]} faces Vertex indices for each face, for example: [[0, 1, 2], [2, 3, 4]]
   * @returns 
   */
  public static triangulateMesh(
    vertices: Vector3[], 
    faces: number[][]
  ): Uint16Array {
    if (vertices.length === 0) { return new Uint16Array(); }
  
    const triangulatedIndices: number[] = [];
  
    for (const face of faces) {
      const numVerticesInFace = face.length;
  
      // A face cannot have < 3 vertices
      if (numVerticesInFace < 3) { continue; }
      
      // If face is already a triangle
      if (numVerticesInFace === 3) { triangulatedIndices.push(...face); continue; }
    
      // Map the vertices this face uses
      const polygonVertices = face.map(index => vertices[index]);
  
      // Calculate the face normal to determine the best projection plane
      const v0 = polygonVertices[0];
      const v1 = polygonVertices[1];
      const v2 = polygonVertices[2];
  
      const edge1 = new Vector3().subVectors(v1, v0);
      const edge2 = new Vector3().subVectors(v2, v0);
      const normal = new Vector3().crossVectors(edge1, edge2);
  
      // Determine the dominant axis of the normal
      const absX = Math.abs(normal.x);
      const absY = Math.abs(normal.y);
      const absZ = Math.abs(normal.z);
  
      let projectedCoords: number[];
  
      switch (true) {
        // Dominant axis is X, so we project onto the YZ plane.
        case (absX > absY && absX > absZ): {
          projectedCoords = polygonVertices.flatMap(v => [v.y, v.z]);
          break;
        }
  
        // Dominant axis is Y, so we project onto the XZ plane.
        case (absY > absZ): {
          projectedCoords = polygonVertices.flatMap(v => [v.x, v.z]);
          break;
        }
  
        // If neither are true, assume dominant axis is Z.
        default: {
          projectedCoords = polygonVertices.flatMap(v => [v.x, v.y]);
          break;
        }
      }
  
      const localIndices = earcut(projectedCoords);
  
      // Map local indices back to the original global indices from the input face.
      const globalIndices = localIndices.map(localIndex => face[localIndex]);
      triangulatedIndices.push(...globalIndices);
    }
  
    return new Uint16Array(triangulatedIndices);
  }

  /**
   * Fixes the winding order of a mesh using a propagation algorithm.
   * 
   * @param {Uint16Array} indices
   * @param {Vector3[]} vertices
   * @param {Vector3} center Geometric center of the mesh.
   * @returns {Uint16Array}
   */
  public static fixIndexWindingOrder(
    indices: Uint16Array,
    vertices: Vector3[],
    center: Vector3
  ): Uint16Array {
    if (!indices || indices.length === 0) {
      console.error("Geometry winding failed; mesh has no indices.");
      return new Uint16Array();
    }

    // Build Adjacency Map
    const adjacencyMap = new Map<string, number[]>();
    for (let i = 0; i <= indices.length; i += 3) {
      const i0 = indices[i];
      const i1 = indices[i + 1];
      const i2 = indices[i + 2];

      const edges = [
        [i0, i1],
        [i1, i2],
        [i2, i0],
      ].map(edge => edge.sort((a, b) => a - b).join('-'));

      for (const edgeKey of edges) {
        if (!adjacencyMap.has(edgeKey)) {
          adjacencyMap.set(edgeKey, []);
        }
        adjacencyMap.get(edgeKey)!.push(i);
      }
    }

    // Find and Orient the Seed Triangle
    const numTriangles = indices.length / 3;
    const visited = new Array(numTriangles).fill(false);
    const queue: number[] = [];

    let maxDistSq = -1;
    let seedTriangleIndex = 0;

    for (let i = 0; i < indices.length; i += 3) {
      const v0 = vertices[indices[i]];
      const v1 = vertices[indices[i + 1]];
      const v2 = vertices[indices[i + 2]];

      const triangleCenter = v0.clone().add(v1).add(v2).divideScalar(3);
      const distSq = triangleCenter.lengthSq();

      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        seedTriangleIndex = i;
      }
    }

    // Use the dot-product method to orient the seed triangle correctly.
    const i0 = indices[seedTriangleIndex];
    const i1 = indices[seedTriangleIndex + 1];
    const i2 = indices[seedTriangleIndex + 2];

    const v0 = vertices[i0];
    const v1 = vertices[i1];
    const v2 = vertices[i2];

    const edge1 = new Vector3().subVectors(v1, v0);
    const edge2 = new Vector3().subVectors(v2, v0);
    const normal = new Vector3().crossVectors(edge1, edge2);
    const vectorToFace = new Vector3().subVectors(v0, center);

    if (normal.dot(vectorToFace) < 0) {
      // Flip the seed triangle if it's wound incorrectly
      indices[seedTriangleIndex + 1] = i2;
      indices[seedTriangleIndex + 2] = i1;
    }

    // Start the Propagation via Breadth-First Search
    queue.push(seedTriangleIndex);
    visited[seedTriangleIndex / 3] = true;

    while (queue.length > 0) {
      const currentTriangleIndex = queue.shift()!;
      
      const triA_i0 = indices[currentTriangleIndex];
      const triA_i1 = indices[currentTriangleIndex + 1];
      const triA_i2 = indices[currentTriangleIndex + 2];

      const edgesOfA = [
          [triA_i0, triA_i1],
          [triA_i1, triA_i2],
          [triA_i2, triA_i0],
      ];

      for (const edge of edgesOfA) {
        const edgeKey = [...edge].sort((a, b) => a - b).join('-');
        const neighbors = adjacencyMap.get(edgeKey) || [];

        for (const neighborTriangleIndex of neighbors) {
          if (neighborTriangleIndex === currentTriangleIndex) continue;

          const neighborTriangleId = neighborTriangleIndex / 3;
          if (!visited[neighborTriangleId]) {
            visited[neighborTriangleId] = true;

            // Check and fix the neighbor's winding
            const triB_i0 = indices[neighborTriangleIndex];
            const triB_i1 = indices[neighborTriangleIndex + 1];
            const triB_i2 = indices[neighborTriangleIndex + 2];

            const edgesOfB = [
              [triB_i0, triB_i1],
              [triB_i1, triB_i2],
              [triB_i2, triB_i0],
            ];

            for (const neighborEdge of edgesOfB) {
              if (neighborEdge[0] === edge[0] && neighborEdge[1] === edge[1]) {
                // Winding is inconsistent, flip the neighbor.
                const temp = indices[neighborTriangleIndex + 1];
                indices[neighborTriangleIndex + 1] = indices[neighborTriangleIndex + 2];
                indices[neighborTriangleIndex + 2] = temp;
                break;
              }
            }

            queue.push(neighborTriangleIndex);
          }
        }
      }
    }

    return indices;
  }

  /**
   * Takes in an arbitrary mesh and flat maps its vertices [x0, y0, z0, x1, y1, z1, ...] according to the indices.
   * This function assumes a triangulated mesh.
   * 
   * @returns {Float32Array}
   */
  public static flatMapMesh(
    vertices: Vector3[],
    indices: Uint16Array
  ): Float32Array {
    if (!indices || indices.length === 0) {
      console.error("Geometry unindexing failed; mesh has no indices.");
      return new Float32Array();
    }

    const flatPositions = new Float32Array(indices.length * 3);

    for (let i = 0; i < indices.length; i++) {
      const vertexIndex = indices[i];

      const vertex = vertices[vertexIndex];
      const offset = i * 3;

      flatPositions[offset + 0] = vertex.x;
      flatPositions[offset + 1] = vertex.y;
      flatPositions[offset + 2] = vertex.z;
    }

    return flatPositions;
  }

  /**
   * Takes in an arbitrary mesh and flat maps each face's normals [v1n, v2n, v3n, ...] according to the indices.
   * This function assumes a triangulated mesh.
   * 
   * @returns {Float32Array}
   */
  public static flatMapNormals(
    vertices: Vector3[],
    indices: Uint16Array
  ): Float32Array {
    if (!indices || indices.length === 0) {
      console.error("Normal calculation failed; mesh has no indices.");
      return new Float32Array();
    }

    const flatNormals = new Float32Array(indices.length * 3);

    for (let i = 0; i < indices.length; i += 3) {
      // Parse out relevant data
      const i0 = indices[i];
      const i1 = indices[i + 1];
      const i2 = indices[i + 2];

      const v0 = vertices[i0];
      const v1 = vertices[i1];
      const v2 = vertices[i2];

      // Calculate the triangle's geometric normal
      const edge1 = new Vector3().subVectors(v1, v0);
      const edge2 = new Vector3().subVectors(v2, v0);
      const normal = new Vector3().crossVectors(edge1, edge2).normalize();

      // Assign the same normal to all three vertices of the triangle
      const offset0 = i * 3;
      const offset1 = (i + 1) * 3;
      const offset2 = (i + 2) * 3;

      flatNormals[offset0] = normal.x;
      flatNormals[offset0 + 1] = normal.y;
      flatNormals[offset0 + 2] = normal.z;

      flatNormals[offset1] = normal.x;
      flatNormals[offset1 + 1] = normal.y;
      flatNormals[offset1 + 2] = normal.z;

      flatNormals[offset2] = normal.x;
      flatNormals[offset2 + 1] = normal.y;
      flatNormals[offset2 + 2] = normal.z;
    }

    return flatNormals;
  }
}