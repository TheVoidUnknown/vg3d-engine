import type { IComponent, IComponentStatic } from "./Component.types";

export default abstract class Component implements IComponent<Component, IComponentStatic> {
  public isDirty = true;

  public static type() { return "Component" }
  public type() { return Component.type(); }
  public init() { return; }
  public update() { return; }
  public serialize() { return {} as IComponentStatic; }
}