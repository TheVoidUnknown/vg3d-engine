// component
import type Animation3DComponent from "../components/Animation3D/Animation3DComponent";

// threejs
import { Vector3, Quaternion, Euler, Matrix4, MathUtils } from "three";

// types
import type Animatable from "../core/animatable/Animatable";
import type Level from "../core/level/Level";
import type { IAnimationParameters } from "./AnimationService";
import type { ITheme } from "../core/level/Level.types";
import type { RawRgb } from "./ColorService";

// utils
import AnimationService from "./AnimationService";
import Mat4Pool from "../core/mat4Pool/Mat4Pool";
import ColorService from "./ColorService";



const _scratchVec3Pos = new Vector3();
const _scratchVec3Scale = new Vector3();
const _scratchEuler = new Euler();
const _scratchQuat = new Quaternion();
const _scratchOriginMat = new Matrix4();

export default class Animation3DService {
  public static getLocalTRS(
    target: Matrix4,
    parameters: IAnimationParameters
  ): Matrix4 {
    target.identity();

    // Extract parameters with fallbacks
    const moveX = parameters.Move ? parameters.Move[0] : 0;
    const moveY = parameters.Move ? parameters.Move[1] : 0;
    const moveZ = parameters.Move ? parameters.Move[2] : 0;

    const scaleX = parameters.Scale ? parameters.Scale[0] : 1;
    const scaleY = parameters.Scale ? parameters.Scale[1] : 1;
    const scaleZ = parameters.Scale ? parameters.Scale[2] : 1;

    // Prepare components
    _scratchVec3Pos.set(moveX, moveY, moveZ);
    _scratchVec3Scale.set(scaleX, scaleY, scaleZ);

    // Handle rotation in euler angles first
    if (parameters.Rotation) {
      _scratchEuler.set(
        MathUtils.degToRad(parameters.Rotation[0]),
        MathUtils.degToRad(parameters.Rotation[1]),
        MathUtils.degToRad(parameters.Rotation[2])
      );
      _scratchQuat.setFromEuler(_scratchEuler);
    } else {
      _scratchQuat.set(0, 0, 0, 1);
    }

    // Compose T * R * S
    target.compose(_scratchVec3Pos, _scratchQuat, _scratchVec3Scale);

    return target;
  }

  private static _accumulateTRS(
    outWorldMatrix: Matrix4,
    time: number,
    targetObj: Animatable,
    level: Level,
    parameters: IAnimationParameters
  ): void {
    this.getLocalTRS(outWorldMatrix, parameters);

    let current = targetObj;
    let parentId = (current.getComponent("Animation3D") as Animation3DComponent)?.parentId;

    // Traverse up the hierarchy
    while (parentId) {
      const parent = level.getObject(parentId);
      if (!parent) { break; }

      // TODO: Rewrite to accept number[][] instead of IAnimationParameters,
      // trying to clear a scratch object is just as expensive as allocating a new one
      const params = {};

      const parentComp = parent.getComponent("Animation3D") as Animation3DComponent;
      const currentComp = current.getComponent("Animation3D") as Animation3DComponent;

      // Get a scratchorary matrix from the pool for the parent's local transform
      const parentLocalMatrix = Mat4Pool.get();
      
      // Calculate parent's parameters, stuff its matrix into the pool
      const parentParameters = AnimationService.interpolateTracks(time, parentComp, params, currentComp.parentSettings, true);
      this.getLocalTRS(parentLocalMatrix, parentParameters);
      outWorldMatrix.premultiply(parentLocalMatrix);

      Mat4Pool.release(parentLocalMatrix); // Release the matrix back to the pool!

      // Move up the chain
      current = parent;
      parentId = parentComp.parentId;
    }
  }

  public static getWorldMatrix(
    time: number,
    target: Animatable,
    level: Level,
    parameters: IAnimationParameters
  ): Matrix4 {
    const comp = target.getComponent("Animation3D") as Animation3DComponent;
    if (!comp) { throw new Error(`Object "${target.name}" [ ${target.id} ] does not have an Animation3D component!`); }

    // Get the hierarchy matrix
    const worldMatrix = new Matrix4();
    this._accumulateTRS(worldMatrix, time, target, level, parameters);

    // Apply origin pivot (PA does +origin instead of -origin for... some reason)
    if (comp.origin && (comp.origin.x !== 0 || comp.origin.y !== 0 || comp.origin.z !== 0)) {
      _scratchOriginMat.makeTranslation(comp.origin.x, comp.origin.y, comp.origin.z);
      worldMatrix.multiply(_scratchOriginMat);
    }

    return worldMatrix;
  }

  public static getColorsAt(
    time: number,
    component: Animation3DComponent,
    theme: ITheme
  ): { color: RawRgb; shade: RawRgb } {
    const track = component.tracks.Color;

    if (!track) {
      const bg = ColorService.rgbaToRaw(theme.background);
      return { color: bg, shade: bg };
    }

    const { prev, next, t } = AnimationService.interpolateTrack(track, time);

    if (t === 0) {
      return {
        color: this._resolveColor(prev.data[0], theme),
        shade: this._resolveColor(prev.data[1], theme)
      };
    }
    if (t === 1) {
      return {
        color: this._resolveColor(next.data[0], theme),
        shade: this._resolveColor(next.data[1], theme)
      };
    }

    const colorA = this._resolveColor(prev.data[0], theme);
    const colorB = this._resolveColor(next.data[0], theme);

    const shadeA = this._resolveColor(prev.data[1], theme);
    const shadeB = this._resolveColor(next.data[1], theme);

    return {
      color: AnimationService.lerpArrays(colorA, colorB, t) as RawRgb,
      shade: AnimationService.lerpArrays(shadeA, shadeB, t) as RawRgb,
    };
  }

  private static _resolveColor(index: number, theme: ITheme): RawRgb {
    const hex = theme.objects[index];
    if (!hex) return [0, 0, 0, 1]; 
    return ColorService.rgbaToRaw(hex);
  }
}