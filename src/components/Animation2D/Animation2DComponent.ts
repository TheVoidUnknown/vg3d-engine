import type { VgdMeshType } from "../../meshes";
import AnimationComponent from "../Animation/AnimationComponent";
import type { IAnimationData } from "../Animation/AnimationComponent";

export interface IAnimation2DData extends IAnimationData {
  type: "Animation2D";
  mesh?: VgdMeshType;
  zOffset: number;
  origin: { x: number; y: number; }
}

export default class Animation2DComponent extends AnimationComponent<IAnimation2DData> {
  public static readonly TYPE = "Animation2D" as const;

  public zOffset = 0;
  public origin = { x: 0, y: 0 };

  constructor(initial?: Partial<IAnimation2DData>) {
    super();
    this.init();

    if (initial) { this.assign(initial); }
  }

  public static type() { return this.TYPE; }
  public type() { return Animation2DComponent.TYPE; }

  public init() {
    this._isDirty = true;
    this.tracks = {};
    this.spawnTime = 1;
    this.lifetime = 5;
    this.parentSettings = {};
    this.zOffset = 0;
    this.origin = structuredClone({ x: 0, y: 0 });
    this.refreshRandomSeed();
  }

  public static from(data: IAnimation2DData): Animation2DComponent {
    return new Animation2DComponent(data);
  }

  public serialize(): IAnimation2DData {
    // Serialize data shared between all animation types
    const base = this.serializeShared(); 

    // Tack on the 2D-specific data
    return {
      ...base,
      type: Animation2DComponent.TYPE,
      zOffset: this.zOffset,
      origin: structuredClone(this.origin),
    };
  }

  public override assign(data: Partial<IAnimation2DData>): this {
    // Let the base class handle most of the work
    super.assign(data); 

    if (data.zOffset) { this.zOffset = data.zOffset; }

    if (data.origin) { 
      this.origin = structuredClone(data.origin); 
    }

    return this;
  }
}