import type { Matrix4, Vector3 } from 'three';
import Shader from './Shader';

export interface ILightSource {
  pos: Vector3;
  luminosity: number;
}

export interface IPostProcessPass {
  shader: Shader;
  enabled: boolean;
  onApply?: (shader: Shader) => void; 
}

export interface ICamera {
  view: Matrix4;
  projection: Matrix4;
}

export interface IMaterial {
  objectColor: [number, number, number]; // RGB 0-1
  shadeColor: [number, number, number];  // RGB 0-1
  ambientLight: [number, number, number]; // RGB 0-1
}