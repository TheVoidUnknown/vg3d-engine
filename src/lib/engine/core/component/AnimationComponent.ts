import KeyframeTrack from "../keyframeTrack/KeyframeTrack";
import Component from "./Component";

import type { IParentSettings } from "$lib/engine/services/AnimationService";
import type { IKeyframeTrack } from "../keyframeTrack/KeyframeTrack.types";
import type { IKeyframe, KeyframeType } from "../keyframe/Keyframe.types";
import type { IComponent, IComponentStatic } from "./Component.types";
import type { MeshType } from "$lib/engine/meshes/3DMeshes";

type PartialTracks = Partial<Record<KeyframeType, KeyframeTrack>>;
type PartialTracksSerialized = Partial<Record<KeyframeType, IKeyframeTrack>>;

export interface IAnimationComponent extends IComponentStatic {
  parentId?: string;
  tracks: PartialTracksSerialized;
  spawnTime: number;
  lifetime: number;
  mesh?: MeshType;
  parentSettings: IParentSettings;
}

// Methods and properties shared between 2D and 3D
export default class AnimationComponent extends Component implements IComponent<AnimationComponent, IAnimationComponent> {
  public static readonly TYPE = "Animation" as const;

  public _isDirty!: boolean;
  public _parentIndex?: number;

  public parentId?: string;
  public tracks!: PartialTracks;
  public spawnTime!: number;
  public lifetime!: number;
  public mesh?: MeshType;
  public parentSettings!: IParentSettings;
  public randomSeed!: number;

  constructor(
    initial?: Partial<IAnimationComponent>
  ) {
    super();
    this.init();

    if (initial) { this.assign(initial); }
  };

  public static from(data: IAnimationComponent): AnimationComponent {
    return new AnimationComponent(data);
  }

  public static type() { return this.TYPE; }
  public type() { return AnimationComponent.type(); }

  public init() {
    this._isDirty = true;

    this.tracks = {};
    this.spawnTime = 0;
    this.lifetime = 30;
    this.parentSettings = {};
    this.refreshRandomSeed();
  }

  public update() {
    return;
  }

  public serialize(): IAnimationComponent {
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
      parentSettings: structuredClone(this.parentSettings)
    };
  }

  public assign(data: Partial<IAnimationComponent>): this {
    if (data.parentId) { this.parentId = data.parentId; }
    if (data.mesh) { this.mesh = data.mesh; }

    if (data.tracks !== undefined) {
      for (const k in data.tracks) {
        const key = k as KeyframeType;
        this.createTrack(key, data.tracks[key]);
      }
    }

    if (data.spawnTime !== undefined) { this.spawnTime = data.spawnTime; }
    if (data.lifetime !== undefined) { this.lifetime = data.lifetime; }
    if (data.parentSettings) { this.parentSettings = structuredClone(data.parentSettings); }

    return this;
  }

  public createTrack<T extends KeyframeType>(type: T, data?: IKeyframeTrack): this {
    this.tracks[type] = KeyframeTrack.from(data ?? []);
    return this;
  }

  public deleteTrack<T extends KeyframeType>(type: T): this {
    delete this.tracks[type];
    return this;
  }

  public addKeyframe<T extends KeyframeType>(type: T, data?: Partial<IKeyframe>): this {
    if (!this.tracks[type]) { this.createTrack(type); }
    if (this.tracks[type] && data) {
      this.tracks[type].addKeyframe(data);
    }
    return this;
  }

  public setMesh(mesh: MeshType): this {
    this.mesh = mesh;
    return this;
  }

  public setParent(parentId: string, parentIndex: number): this {
    this.parentId = parentId;
    this._parentIndex = parentIndex;
    return this;
  }

  public setParenting(type: KeyframeType, enabled: boolean): this {
    if (!this.parentSettings[type]) {
      this.parentSettings[type] = { enabled, offset: 0 };
    } else {
      this.parentSettings[type].enabled = enabled;
    }
    return this;
  }

  public setParentOffset(type: KeyframeType, offset: number): this {
    if (!this.parentSettings[type]) {
      this.parentSettings[type] = { enabled: true, offset };
    } else {
      this.parentSettings[type].offset = offset;
    }
    return this;
  }

  public refreshRandomSeed() {
    this.randomSeed = Math.random() * 9999999;
  }
}