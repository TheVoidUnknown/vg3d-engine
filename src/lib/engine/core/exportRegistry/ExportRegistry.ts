import type Animatable from "../animatable/Animatable";

import type { IVgdLevelObject } from "$lib/engine/vgd/Vgd.types";
import type { ComponentType } from "../component/Component.types";

export type ExportHandler = (
  component: ComponentType,
  target: Animatable,
  objects: Map<string, Animatable>
) => IVgdLevelObject[];

export default class ExportRegistry {
  public static handlers: Map<string, ExportHandler>;

  public static init() {
    this.handlers = new Map();

    console.info("Export Registry initialized");
  }

  public static register(type: string, handler: ExportHandler) {
    if (this.handlers.has(type)) {
      console.warn(`[ExportRegistry] Component exporter for type "${type}" was already registered, the previous entry will be overwritten!`);
      this.handlers.delete(type);
    }

    this.handlers.set(type, handler);
    console.info(`[ExportRegistry] Registered component exporter "${type}" -> ${handler.name}`);
  }

  public static runHandler(
    component: ComponentType,
    target: Animatable,
    objects: Map<string, Animatable>
  ): IVgdLevelObject[] {
    component.update();
    const type = component.type();

    const handler = this.handlers.get(type);
    if (handler) {
      try {
        return handler(component, target, objects); 
      } catch (oops) {
        console.error(`[ExportRegistry] Error exporting component ${type} in object "${target.name}" [${target.id}]:\n${oops}`);
        console.error((oops as { stack: string }).stack);
        console.error("Offending object:\n", target);
        return [];
      }
    } else {
      console.error(`[ExportRegistry] No handler was registered to export component "${type}"!`);
      return [];
    }
  }
}