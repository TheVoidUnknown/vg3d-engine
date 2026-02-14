import { ComponentRegistry } from "../componentRegistry/ComponentRegistry";
import { generateUUID } from "three/src/math/MathUtils.js";

import type { ComponentDataType, ComponentInstanceType, ComponentNameType } from "../componentRegistry";
import type { IAnimatable } from "./Animatable.types";

export class Animatable {
  public id: string;
  public name: string;
  public components: ComponentInstanceType[];

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
    const components: ComponentDataType[] = [];

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

  public addComponent(type: ComponentNameType): ComponentInstanceType {
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

  public getComponent<T extends ComponentNameType>(type: T): ComponentInstanceType {
    for (const component of this.components) {
      if (component.type() === type) { return component; }
    }

    throw new Error(`[Animatable] Animatable "${this.name}" [ ${this.id} ] does not possess the component "${type}"`);
  }
}