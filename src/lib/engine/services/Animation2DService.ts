import type Animation2DComponent from "../core/component/Animation2DComponent";
import type Animatable from "../core/animatable/Animatable";
import AnimationService from "./AnimationService";
import type { IAnimationParameters } from "./AnimationService";
import { Quaternion, Euler, Matrix4, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import type { ITheme } from "../core/level/Level.types";
import type { RawRgb } from "./ColorService";
import ColorService from "./ColorService";
import Mat4Pool from "../core/mat4Pool/Mat4Pool";
import type Level from "../core/level/Level";

const _tempVec3Pos = new Vector3();
const _tempVec3Scale = new Vector3();
const _tempEuler = new Euler();
const _tempQuat = new Quaternion();
const _tempOriginMat = new Matrix4();

export default class Animation2DService {
  public static getLocalTRS(
    target: Matrix4, 
    parameters: IAnimationParameters
  ): Matrix4 {
    target.identity();

    // Extract parameters with fallbacks
    const moveX = parameters.Move ? parameters.Move[0] : 0;
    const moveY = parameters.Move ? parameters.Move[1] : 0;
    const scaleX = parameters.Scale ? parameters.Scale[0] : 1;
    const scaleY = parameters.Scale ? parameters.Scale[1] : 1;
    const rotation = parameters.Rotation ? parameters.Rotation[0] : 0;

    // Prepare components
    _tempVec3Pos.set(moveX, moveY, 0);
    _tempVec3Scale.set(scaleX, scaleY, 1);

    if (rotation !== 0) {
      _tempEuler.set(0, 0, degToRad(rotation));
      _tempQuat.setFromEuler(_tempEuler);
    } else {
      _tempQuat.set(0, 0, 0, 1);
    }

    // Compose T * R * S
    target.compose(_tempVec3Pos, _tempQuat, _tempVec3Scale);

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
    let parentId = (current.getComponent("Animation2D") as Animation2DComponent)?.parentId;

    // Traverse up the hierarchy
    while (parentId) {
      const parent = level.getObject(parentId);
      if (!parent) { break; }

      const parentComp = parent.getComponent("Animation2D") as Animation2DComponent;
      const currentComp = current.getComponent("Animation2D") as Animation2DComponent;

      // Get a temporary matrix from the pool for the parent's local transform
      const parentLocalMatrix = Mat4Pool.get();
      
      // Calculate parent's parameters, stuff its matrix into the pool
      const parentParameters = AnimationService.interpolateTracks(time, parentComp, currentComp.parentSettings, true);
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
    const comp = target.getComponent("Animation2D") as Animation2DComponent;
    if (!comp) { throw new Error(`Object "${target.name}" [ ${target.id} ] does not have an Animation2D component!`); }

    // Get the hierarchy matrix
    const worldMatrix = new Matrix4();
    this._accumulateTRS(worldMatrix, time, target, level, parameters);

    // Apply origin pivot (PA does +origin instead of -origin for... some reason)
    if (comp.origin && (comp.origin.x !== 0 || comp.origin.y !== 0)) {
      _tempOriginMat.makeTranslation(comp.origin.x, comp.origin.y, 0);
      worldMatrix.multiply(_tempOriginMat);
    }

    // Apply z-offset
    if (comp.zOffset) {
      worldMatrix.elements[14] += (comp.zOffset + AnimationService.seededRandom(comp.randomSeed)) * 2;
    }

    return worldMatrix;
  }

  public static getColorAt(
    time: number,
    component: Animation2DComponent,
    theme: ITheme,
    outTarget?: RawRgb
  ): RawRgb {
    const track = component.tracks.Color;

    // If no track, fallback to background color
    if (!track) { return ColorService.rgbaToRaw(theme.background); }

    const { prev, next, t } = AnimationService.interpolateTrack(track, time);

    // Fast returns
    if (t === 0) {
      const c = ColorService.rgbaToRaw(theme.objects[prev.data[0]]);
      c[3] = prev.data[1];
      return c;
    }

    if (t === 1) {
      const c = ColorService.rgbaToRaw(theme.objects[next.data[0]]);
      c[3] = prev.data[1];
      return c;
    }

    const colorA = ColorService.rgbaToRaw(theme.objects[prev.data[0]]);
    colorA[3] = prev.data[1];
    const colorB = ColorService.rgbaToRaw(theme.objects[next.data[0]]);
    colorB[3] = next.data[1];

    if (outTarget) {
      outTarget = AnimationService.lerpArrays(colorA, colorB, t, outTarget) as RawRgb;
      return outTarget;
    } else {
      return AnimationService.lerpArrays(colorA, colorB, t) as RawRgb;
    }
  }
}