import type { IMesh } from "../../core/mesh/Mesh.types";
import { Vector3 } from "three";

const Icosahedron = (radius: number = 1, subdivisions: number = 0): IMesh => {
  const t = (1 + Math.sqrt(5)) / 2; // Golden ratio

  // Start with the 12 vertices of an icosahedron, normalized to form a unit sphere
  const vertices: Vector3[] = [
    new Vector3(-1,  t,  0).normalize(), new Vector3( 1,  t,  0).normalize(),
    new Vector3(-1, -t,  0).normalize(), new Vector3( 1, -t,  0).normalize(),
    new Vector3( 0, -1,  t).normalize(), new Vector3( 0,  1,  t).normalize(),
    new Vector3( 0, -1, -t).normalize(), new Vector3( 0,  1, -t).normalize(),
    new Vector3( t,  0, -1).normalize(), new Vector3( t,  0,  1).normalize(),
    new Vector3(-t,  0, -1).normalize(), new Vector3(-t,  0,  1).normalize()
  ];

  // Start with the 20 faces (triangles) of the icosahedron
  let faces: number[][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  // A cache to store the index of a midpoint vertex so we don't create it twice.
  // The key is a string representation of the two vertex indices, e.g., "1-5".
  const midpointCache = new Map<string, number>();

  const getMidpoint = (p1: number, p2: number): number => {
    // Create a unique cache key by ordering the indices
    const smallerIndex = Math.min(p1, p2);
    const greaterIndex = Math.max(p1, p2);
    const key = `${smallerIndex}-${greaterIndex}`;

    // If the midpoint is already in the cache, return its index
    if (midpointCache.has(key)) {
      return midpointCache.get(key)!;
    }

    // If not, calculate the midpoint
    const v1 = vertices[p1];
    const v2 = vertices[p2];
    const mid = v1.clone().add(v2).multiply(new Vector3(0.5)).normalize();

    // Add the new vertex to the list
    vertices.push(mid);
    const newIndex = vertices.length - 1;

    // Cache the new index and return it
    midpointCache.set(key, newIndex);
    return newIndex;
  };

  // Subdivide the faces recursively
  for (let i = 0; i < subdivisions; i++) {
    const newFaces: number[][] = [];
    for (const face of faces) {
      const v1 = face[0];
      const v2 = face[1];
      const v3 = face[2];

      // Get the midpoints of the three edges of the triangle
      const a = getMidpoint(v1, v2);
      const b = getMidpoint(v2, v3);
      const c = getMidpoint(v3, v1);

      // Replace the single triangle with four new smaller triangles
      newFaces.push([v1, a, c]);
      newFaces.push([v2, b, a]);
      newFaces.push([v3, c, b]);
      newFaces.push([a, b, c]);
    }
    faces = newFaces;
  }

  // Scale all vertices to the final desired radius
  if (radius !== 1) {
    for (const vertex of vertices) {
      vertex.multiply(new Vector3(radius));
    }
  }

  return {
    name: "Icosahedron",
    vertices: vertices,
    faces: faces
  };
}

export default Icosahedron;