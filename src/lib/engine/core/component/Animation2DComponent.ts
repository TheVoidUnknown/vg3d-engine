import AnimationComponent, { type IAnimationComponent } from "./AnimationComponent";

import type { IKeyframe, KeyframeType } from "../keyframe/Keyframe.types";
import type { VgdMeshType } from "$lib/engine/meshes/2D/VgdMeshes";

type PartialTracksSerialized = Partial<Record<KeyframeType, IKeyframe[]>>;

export interface IAnimation2DComponent extends Omit<IAnimationComponent, "mesh"> {
  mesh?: VgdMeshType;
  zOffset: number;
  origin: {
    x: number;
    y: number;
  }
}

export default class Animation2DComponent extends AnimationComponent {
  public static readonly TYPE = "Animation2D" as const;

  public mesh?: VgdMeshType;
  public zOffset!: number;
  public origin!: { x: number, y: number }

  constructor(
    initial?: Partial<IAnimation2DComponent>
  ) {
    super();
    this.init();

    if (initial) { this.assign(initial); }
  };

  public static from(data: IAnimation2DComponent): Animation2DComponent {
    return new Animation2DComponent(data);
  }

  public static type() { return this.TYPE; }
  public type() { return Animation2DComponent.type(); }

  public init() {
    this._isDirty = true;

    this.tracks = {};
    this.spawnTime = 1;
    this.lifetime = 5;
    this.zOffset = 0;
    this.origin = { x: 0, y: 0 };
    this.parentSettings = {};
  }

  public update() {
    return;
  }

  public serialize(): IAnimation2DComponent {
    const tracks: PartialTracksSerialized = {};
    for (const k in this.tracks) {
      const key = k as KeyframeType;
      tracks[key] = this.tracks[key]?.serialize();
    }

    return {
      type: this.type(),
      parentId: this.parentId,
      zOffset: this.zOffset,
      mesh: this.mesh,
      tracks,
      spawnTime: this.spawnTime,
      lifetime: this.lifetime,
      origin: structuredClone(this.origin),
      parentSettings: structuredClone(this.parentSettings)
    };
  }

  public assign(data: Partial<IAnimation2DComponent>): this {
    if (data.parentId) { this.parentId = data.parentId; }
    if (data.mesh) { this.mesh = data.mesh; }

    if (data.tracks !== undefined) {
      for (const k in data.tracks) {
        const key = k as KeyframeType;
        this.createTrack(key, data.tracks[key]);
      }
    }

    if (data.zOffset !== undefined) { this.zOffset = data.zOffset; }
    if (data.spawnTime !== undefined) { this.spawnTime = data.spawnTime; }
    if (data.lifetime !== undefined) { this.lifetime = data.lifetime; }
    if (data.origin) { this.origin = structuredClone(data.origin); }
    if (data.parentSettings) { this.parentSettings = structuredClone(data.parentSettings); }

    return this;
  }
}