import type { ComponentNameType, ComponentConstructorType, ComponentDataType, GetConstructor, GetInstance } from "./ComponentRegistry.types";
import { COMPONENTS } from "../../registry/RegisterComponents";

const NAME = "ComponentRegistry";

export default class ComponentRegistry {
  private static components = new Map<string, ComponentConstructorType>();

  public static init() {
    this.components.clear();

    for (const C of COMPONENTS) {
      this.register(C.TYPE, C);
    }

    console.info(`[${NAME}] Registered ${this.components.size} components.`);
  }

  public static register(name: string, constructor: ComponentConstructorType) {
    if (this.components.has(name)) {
      console.warn(`[${NAME}] Overwriting component "${name}"`);
    }
    this.components.set(name, constructor);
  }

  public static get<T extends ComponentNameType>(name: T): GetConstructor<T> {
    const Constructor = this.components.get(name);
    if (!Constructor) {
      throw new Error(`[${NAME}] Component "${name}" not registered.`);
    }

    return Constructor as GetConstructor<T>;
  }

  public static create<D extends ComponentDataType>(data: D): GetInstance<D['type']> {
    const ClassRef = this.get(data.type as ComponentNameType);

    return ClassRef.from(data as any) as GetInstance<D['type']>;
  }
}