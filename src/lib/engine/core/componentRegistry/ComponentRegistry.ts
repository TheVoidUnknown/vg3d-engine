import type { ComponentNameType } from "$lib/engine/registry/RegisterComponents";
import type { IComponent, IComponentStatic } from "../component/Component.types";
import type { IComponentConstructor } from "./ComponentRegistry.types";

export default class ComponentRegistry {
  private static components: Map<string, IComponentConstructor<any, any>> = new Map();

  public static init() {
    this.components = new Map();

    console.info("Component Registry initialized");
  }

  public static register<T extends IComponent<T, D>, D extends IComponentStatic>(
    name: ComponentNameType, 
    def: IComponentConstructor<T, D>
  ) {
    if (this.components.has(name)) {
      console.warn(`[ComponentRegistry] Component with name "${name}" was already registered, the previous entry will be overwritten!`);
      this.components.delete(name);
    }

    this.components.set(name, def);
    console.info(`[ComponentRegistry] Registered component "${name}" -> ${def.name}`);
  }

  public static get<T extends IComponent<T, D>, D extends IComponentStatic>(
    name: ComponentNameType
  ): IComponentConstructor<T, D> | undefined {
    return this.components.get(name) as IComponentConstructor<T, D> | undefined;
  }

  public static create<D extends IComponentStatic>(data: D): any {
    const ComponentClass = this.components.get(data.type);

    if (!ComponentClass) { throw new Error(`[ComponentRegistry] Component type "${data.type}" is not registered.`); }

    return ComponentClass.from(data);
  }
}