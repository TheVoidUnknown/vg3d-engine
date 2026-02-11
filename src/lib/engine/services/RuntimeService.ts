import type Animatable from "../core/animatable/Animatable";
import RenderBatch from "../gl/RenderBatch";

import type { ComponentType } from "../core/component/Component.types";
import type { ITheme } from "../core/level/Level.types";
import type { RawRgb } from "./ColorService";
import type { Matrix4 } from "three";
import type Level from "../core/level/Level";

export type RuntimeHandler = (
  service: typeof RuntimeService,
  time: number,
  component: ComponentType,
  target: Animatable,
  level: Level,
  theme: ITheme
) => void;

export default class RuntimeService {
  public static isError: boolean;
  private static handlers: Map<string, RuntimeHandler>;

  public static opaqueBatches = new Map<string, RenderBatch>();
  public static transparentBatches = new Map<string, RenderBatch>();

  public static init() {
    this.isError = false;
    this.handlers = new Map();

    this.opaqueBatches.clear();
    this.transparentBatches.clear();

    console.info("Runtime Service initialized");
  }

  public static register(type: string, handler: RuntimeHandler) {
    if (this.handlers.has(type)) {
      console.warn(`[RuntimeService] Component handler for type "${type}" was already registered, the previous entry will be overwritten!`);
      this.handlers.delete(type);
    }

    this.handlers.set(type, handler);
    console.info(`[RuntimeService] Registered component handler "${type}" -> ${handler.name}`);
  }

  public static clean() {
    this.opaqueBatches.forEach(batch => batch.reset());
    this.transparentBatches.forEach(batch => batch.reset());
  }

  public static commit() {
    this.opaqueBatches.forEach(batch => batch.commit());
    this.transparentBatches.forEach(batch => batch.commit());
  }

  public static update(
    time: number,
    target: Animatable | null,
    level: Level,
    theme: ITheme
  ) {
    if (this.isError || !target) { return; }
    target.components.forEach((c) => { this.runHandler(c, time, target, level, theme); });
  }

  public static runHandler(
    component: ComponentType,
    time: number,
    target: Animatable,
    level: Level,
    theme: ITheme
  ) {
    component.update();
    const type = component.type();

    const handler = this.handlers.get(type);
    if (handler) {
      handler(this, time, component, target, level, theme); 
    } else {
      console.error(`No handler was registered to handle component "${type}"!`);
    }
  }

  // Exposed for component handlers
  public static queueMesh(
    type: string, 
    matrix: Matrix4, 
    color: RawRgb, 
    shade?: RawRgb
  ) {
    const isTransparent = color[3] < 0.99;
    const targetMap = isTransparent ? this.transparentBatches : this.opaqueBatches;

    let batch = targetMap.get(type);
    if (!batch) {
      batch = new RenderBatch();
      targetMap.set(type, batch);
    }
  
    batch.add(matrix, color, shade);
  }
}