import type { MeshType } from "../../meshes";
import { AnimationComponent } from "../Animation/AnimationComponent";
import type { IAnimationData } from "../Animation/AnimationComponent";

export interface IAnimation3DData extends IAnimationData {
  type: "Animation3D";
  mesh?: MeshType;
  origin: { x: number; y: number; z: number };
}

export class Animation3DComponent extends AnimationComponent<IAnimation3DData> {
  public static readonly TYPE = "Animation3D" as const;

  public origin = { x: 0, y: 0, z: 0 };

  constructor(initial?: Partial<IAnimation3DData>) {
    super();
    this.init();

    if (initial) { this.assign(initial); }
  }

  public static type() { return this.TYPE; }
  public type() { return Animation3DComponent.TYPE; }

  public init() {
    this._isDirty = true;
    this.tracks = {};
    this.spawnTime = 1;
    this.lifetime = 5;
    this.parentSettings = {};
    this.origin = structuredClone({ x: 0, y: 0, z: 0 });
    this.refreshRandomSeed();
  }

  public static from(data: IAnimation3DData): Animation3DComponent {
    return new Animation3DComponent(data);
  }

  public serialize(): IAnimation3DData {
    // Serialize data shared between all animation types
    const base = this.serializeShared(); 

    // Tack on the 3D-specific data
    return {
      ...base,
      type: Animation3DComponent.TYPE,
      origin: structuredClone(this.origin),
    };
  }

  public override assign(data: Partial<IAnimation3DData>): this {
    // Let the base class handle most of the work
    super.assign(data); 

    if (data.origin) { 
      this.origin = structuredClone(data.origin); 
    }

    return this;
  }
}