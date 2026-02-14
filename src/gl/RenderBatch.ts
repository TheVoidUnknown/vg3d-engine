import type { RawRgb } from "../services/ColorService";
import type { Matrix4 } from "three";
import { Vector3 } from "three";

export const INSTANCE_STRIDE = 24; 
export const MAX_INSTANCES = 4096;

interface BatchBuffer {
  data: Float32Array;
  indices: Uint32Array;
  positions: Float32Array;
  depths: Float32Array;
  count: number;
}

export class RenderBatch {
  private _buffers: [BatchBuffer, BatchBuffer];
  private _writeIndex: number = 0;
  private _readIndex: number = 1;

  constructor() {
    this._buffers = [
      this._createBuffer(),
      this._createBuffer()
    ];
  }

  private _createBuffer(): BatchBuffer {
    return {
      data: new Float32Array(MAX_INSTANCES * INSTANCE_STRIDE),
      indices: new Uint32Array(MAX_INSTANCES),
      positions: new Float32Array(MAX_INSTANCES * 3),
      depths: new Float32Array(MAX_INSTANCES),
      count: 0
    };
  }

  public reset() { 
    this._buffers[this._writeIndex].count = 0; 
  }

  // Swap the read and write buffers
  public commit() {
    const temp = this._writeIndex;
    this._writeIndex = this._readIndex;
    this._readIndex = temp;
  }

  // Helper to expose read buffer
  public getReadBuffer(): BatchBuffer {
    return this._buffers[this._readIndex];
  }

  public add(matrix: Matrix4, color: RawRgb, shade?: RawRgb) {
    const buffer = this._buffers[this._writeIndex];
    
    if (buffer.count >= MAX_INSTANCES) return;

    const i = buffer.count;
    let offset = i * INSTANCE_STRIDE;

    const d = buffer.data;

    // Color
    d[offset++] = color[0];
    d[offset++] = color[1];
    d[offset++] = color[2];
    d[offset++] = color[3];

    // Shade
    const s = shade || color;
    d[offset++] = s[0];
    d[offset++] = s[1];
    d[offset++] = s[2];
    d[offset++] = s[3];

    // Matrix
    const el = matrix.elements;
    for (let m = 0; m < 16; m++) {
      d[offset++] = el[m];
    }

    // Position Cache
    const p = buffer.positions;
    const posOffset = i * 3;
    p[posOffset] = el[12];
    p[posOffset + 1] = el[13];
    p[posOffset + 2] = el[14];

    // Reset Index (Identity)
    buffer.indices[i] = i;
    buffer.count++;
  }

  public sort(cameraPos: Vector3, backToFront: boolean = true) {
    const buffer = this._buffers[this._readIndex];
    if (buffer.count < 2) return;

    const count = buffer.count;
    const indices = buffer.indices;
    const positions = buffer.positions;
    const depths = buffer.depths;
    const cx = cameraPos.x;
    const cy = cameraPos.y;
    const cz = cameraPos.z;

    // Precalculate depths
    for (let i = 0; i < count; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];
      depths[i] = (px - cx) ** 2 + (py - cy) ** 2 + (pz - cz) ** 2;
    }

    // Sort indices based on pre-calculated depths
    const activeIndices = indices.subarray(0, count);

    if (backToFront) {
      activeIndices.sort((a, b) => depths[b] - depths[a]);
    } else {
      activeIndices.sort((a, b) => depths[a] - depths[b]);
    }
  }

  public getSortedData(scratchBuffer: Float32Array): Float32Array {
    const buffer = this._buffers[this._readIndex];
    const count = buffer.count;

    if (count === 0) { return scratchBuffer; }

    const indices = buffer.indices;
    const data = buffer.data;

    // Copy sorted chunks into scratchBuffer
    for (let i = 0; i < count; i++) {
      const originalIndex = indices[i];
      const srcStart = originalIndex * INSTANCE_STRIDE;
      const destStart = i * INSTANCE_STRIDE;

      scratchBuffer.set(
        data.subarray(srcStart, srcStart + INSTANCE_STRIDE), 
        destStart
      );
    }

    return scratchBuffer;
  }

  public get size(): number { 
    // Always return the count of the buffer currently designated for READING
    return this._buffers[this._readIndex].count; 
  }

  public get data(): Float32Array {
    // Direct access to the raw read buffer
    return this._buffers[this._readIndex].data;
  }
}