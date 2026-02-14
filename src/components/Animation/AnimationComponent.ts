import { KeyframeTrack } from "../../core/keyframeTrack/KeyframeTrack";
import { Component } from "../../core/component/Component";

import type { IKeyframe, KeyframeType } from "../../core/keyframe/Keyframe.types";
import type { IComponentData } from "../../core/component/Component.types";
import type { IParentSettings } from "../../services/AnimationService";
import type { MeshType } from "../../meshes/3D/meshes";
import type { VgdMeshType } from "../../meshes";

export interface IAnimationData<M = MeshType | VgdMeshType> extends IComponentData {
  parentId?: string;
  tracks?: Partial<Record<KeyframeType, IKeyframe[]>>;
  spawnTime: number;
  lifetime: number;
  mesh?: M;
  parentSettings?: IParentSettings;
}

// Methods and properties shared between 2D and 3D
export abstract class AnimationComponent<D extends IAnimationData> extends Component<D> {
  public parentId?: string;
  public tracks: Partial<Record<KeyframeType, KeyframeTrack>> = {}; 
  public spawnTime: number = 1;
  public lifetime: number = 30;
  public mesh?: D['mesh'];
  public parentSettings: IParentSettings = {};
  public randomSeed: number = 0;

  public _parentIndex?: number;

  constructor() { super(); }

  public init() {
    this._isDirty = true;
    this.tracks = {};
    this.spawnTime = 1;
    this.lifetime = 5;
    this.parentSettings = {};
    this.refreshRandomSeed();
  }

  public update() { return; }

  protected serializeShared(): IAnimationData<D['mesh']> {
    const serializedTracks: Partial<Record<KeyframeType, IKeyframe[]>> = {};
    
    for (const k in this.tracks) {
      const key = k as KeyframeType;
      serializedTracks[key] = this.tracks[key]?.serialize();
    }

    return {
      type: this.type(),
      parentId: this.parentId,
      mesh: this.mesh,
      tracks: serializedTracks,
      spawnTime: this.spawnTime,
      lifetime: this.lifetime,
      parentSettings: structuredClone(this.parentSettings),
    };
  }

  public assign(data: Partial<D>): this {
    if (data.parentId !== undefined) { this.parentId = data.parentId; }
    if (data.mesh !== undefined) { this.mesh = data.mesh; }
    if (data.spawnTime !== undefined) { this.spawnTime = data.spawnTime; }
    if (data.lifetime !== undefined) { this.lifetime = data.lifetime; }
    if (data.parentSettings) { this.parentSettings = structuredClone(data.parentSettings); }

    if (data.tracks) {
      for (const k in data.tracks) {
        const key = k as KeyframeType;
        this.createTrack(key, data.tracks[key]);
      }
    }

    return this;
  }

  public createTrack(
    type: KeyframeType,
    data?: IKeyframe[]
  ): this {
    this.tracks[type] = KeyframeTrack.from(data ?? []);
    return this;
  }

  public deleteTrack(
    type: KeyframeType
  ): this {
    delete this.tracks[type];
    return this;
  }

  public addKeyframe(
    type: KeyframeType,
    data: Partial<IKeyframe>
  ): this {
    if (!this.tracks[type]) { this.createTrack(type); }
    this.tracks[type]?.addKeyframe(data);
    return this;
  }

  public setMesh(
    mesh: MeshType
  ): this {
    this.mesh = mesh;
    return this;
  }

  public setParent(
    parentId: string,
    parentIndex: number
  ): this {
    this.parentId = parentId;
    this._parentIndex = parentIndex;
    return this;
  }

  public setParenting(
    type: KeyframeType,
    enabled: boolean
  ): this {
    if (!this.parentSettings[type]) {
      this.parentSettings[type] = { enabled, offset: 0 };
    } else {
      this.parentSettings[type]!.enabled = enabled;
    }
    return this;
  }

  public setParentOffset(
    type: KeyframeType,
    offset: number
  ): this {
    if (!this.parentSettings[type]) {
      this.parentSettings[type] = { enabled: true, offset };
    } else {
      this.parentSettings[type]!.offset = offset;
    }
    return this;
  }

  public refreshRandomSeed() {
    this.randomSeed = Math.random() * 9999999;
  }
}