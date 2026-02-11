import { generateUUID } from "three/src/math/MathUtils.js";
import type { ComponentType, IComponentType } from "../component/Component.types";
import type { IAnimatable } from "./Animatable.types";
import ComponentRegistry from "$lib/engine/core/componentRegistry/ComponentRegistry";
import type { ComponentNameType } from "$lib/engine/registry/RegisterComponents";

export default class Animatable {
  public id: string;
  public name: string;
  public components: ComponentType[];

  constructor(
    initial?: Partial<IAnimatable>
  ) {
    this.id = generateUUID();
    this.name = "New Object";
    this.components = [];

    if (initial) { this.assign(initial); }
  }

  public static from(data: Partial<IAnimatable>): Animatable {
    return new Animatable(data);
  }

  public serialize(): IAnimatable {
    const components: IComponentType[] = [];

    this.components.forEach((c) => {
      components.push(c.serialize())
    })

    return {
      id: this.id,
      name: this.name,
      components
    }
  }

  public assign(data: Partial<IAnimatable>): this {
    if (data.id) { this.id = data.id; }
    if (data.name) { this.name = data.name; }

    if (data.components) {
      data.components.forEach((c) => {
        this.components.push(ComponentRegistry.create(c));
      })
    }

    return this;
  }

  public _setDirty() { this.components.forEach((o) => o._isDirty = true ); }

  public addComponent(type: ComponentNameType): ComponentType {
    const component = ComponentRegistry.create({ type });
    this.components.push(component);
    return component;
  }

  public deleteComponent(type: ComponentNameType): this {
    this.components.forEach((v, i) => {
      if (v.type() === type) { this.components.splice(i, 1); }
    })

    return this;
  }

  public getComponent<T extends ComponentNameType>(type: T): ComponentType {
    for (const component of this.components) {
      if (component.type() === type) { return component; }
    }

    throw new Error(`[Animatable] Animatable "${this.name}" [ ${this.id} ] does not possess the component "${type}"`);
  }
}