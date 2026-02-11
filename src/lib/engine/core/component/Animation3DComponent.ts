import type { IKeyframeTrack } from "../keyframeTrack/KeyframeTrack.types";
import type { KeyframeType } from "../keyframe/Keyframe.types";
import AnimationComponent, { type IAnimationComponent } from "./AnimationComponent";

type PartialTracksSerialized = Partial<Record<KeyframeType, IKeyframeTrack>>;

export interface IAnimation3DComponent extends IAnimationComponent {
  origin: {
    x: number;
    y: number;
    z: number;
  }
}

export default class Animation3DComponent extends AnimationComponent {
  public static readonly TYPE = "Animation3D" as const;

  public origin!: { x: number, y: number, z: number }

  constructor(
    initial?: Partial<IAnimation3DComponent>
  ) {
    super();
    this.init();

    if (initial) { this.assign(initial); }
  };

  public static from(data: IAnimation3DComponent): Animation3DComponent {
    return new Animation3DComponent(data);
  }

  public static type() { return this.TYPE; }
  public type() { return Animation3DComponent.type(); }

  public init() {
    this._isDirty = true;

    this.tracks = {};
    this.spawnTime = 0;
    this.lifetime = 30;
    this.mesh = "Cube";
    this.origin = { x: 0, y: 0, z: 0 };
    this.parentSettings = {};
  }

  public update() {
    return;
  }

  public serialize(): IAnimation3DComponent {
    const tracks: PartialTracksSerialized = {};
    for (const k in this.tracks) {
      const key = k as KeyframeType;
      tracks[key] = this.tracks[key]?.serialize();
    }

    return {
      type: this.type(),
      parentId: this.parentId,
      mesh: this.mesh,
      tracks,
      spawnTime: this.spawnTime,
      lifetime: this.lifetime,
      origin: structuredClone(this.origin),
      parentSettings: structuredClone(this.parentSettings)
    };
  }

  public assign(data: Partial<IAnimation3DComponent>): this {
    if (data.parentId) { this.parentId = data.parentId; }
    if (data.mesh) { this.mesh = data.mesh; }

    if (data.tracks !== undefined) {
      for (const k in data.tracks) {
        const key = k as KeyframeType;
        this.createTrack(key, data.tracks[key]);
      }
    }

    if (data.spawnTime) { this.spawnTime = data.spawnTime; }
    if (data.lifetime) { this.lifetime = data.lifetime; }
    if (data.origin) { this.origin = structuredClone(data.origin); }
    if (data.parentSettings) { this.parentSettings = structuredClone(data.parentSettings); }

    return this;
  }
}